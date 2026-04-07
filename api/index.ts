import Stripe from 'stripe';
import {
  type Env,
  jsonResponse,
  errorResponse,
  getRate,
  DEPOSIT_AMOUNT,
  requireAuth,
  verifyPassword,
  hashPassword,
  createJWT,
  sendConfirmationEmail,
  sendCancellationEmail,
  sendInvoiceEmail,
  sendConcernEmail,
} from './shared';

export { type Env };

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // CORS headers for local dev
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Public routes
    if (path === '/api/config' && method === 'GET') {
      return jsonResponse({ stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY });
    }
    if (path === '/api/reservations/dates' && method === 'GET') {
      return getDates(env);
    }
    if (path === '/api/reservations/create-intent' && method === 'POST') {
      return createIntent(request, env);
    }
    if (path === '/api/reservations/create' && method === 'POST') {
      return createCheckReservation(request, env);
    }
    if (path === '/api/admin/login' && method === 'POST') {
      return adminLogin(request, env);
    }
    if (path === '/api/webhooks/stripe' && method === 'POST') {
      return stripeWebhook(request, env);
    }

    // Admin routes
    if (path === '/api/reservations' && method === 'GET') {
      return listReservations(request, env);
    }
    if (path === '/api/admin/add-reservation' && method === 'POST') {
      return addReservation(request, env);
    }

    // User management
    if (path === '/api/admin/users' && method === 'GET') {
      return listUsers(request, env);
    }
    if (path === '/api/admin/users' && method === 'POST') {
      return createUser(request, env);
    }
    const userMatch = path.match(/^\/api\/admin\/users\/(\d+)$/);
    if (userMatch && method === 'DELETE') {
      return deleteUser(request, env, userMatch[1]);
    }
    if (userMatch && method === 'PUT') {
      return updateUserPassword(request, env, userMatch[1]);
    }

    // /api/reservations/:id/:action
    const actionMatch = path.match(/^\/api\/reservations\/(\d+)\/(cancel|refund|invoice|mark-paid)$/);
    if (actionMatch && method === 'POST') {
      const id = actionMatch[1];
      const action = actionMatch[2];
      switch (action) {
        case 'cancel': return cancelReservation(request, env, id);
        case 'refund': return refundReservation(request, env, id);
        case 'invoice': return sendInvoice(request, env, id);
        case 'mark-paid': return markPaid(request, env, id);
      }
    }

    return errorResponse('Not found', 404);
  } catch (e) {
    console.error('API error:', e);
    return errorResponse('Internal server error', 500);
  }
}

// --- Public routes ---

async function getDates(env: Env) {
  const { results } = await env.DB.prepare(
    `SELECT event_date FROM reservations WHERE status = 'active' AND event_date >= date('now')`
  ).all<{ event_date: string }>();
  return jsonResponse({ dates: results.map(r => r.event_date) });
}

async function createIntent(request: Request, env: Env) {
  const body = await request.json() as {
    first_name: string; last_name: string; email: string; phone: string;
    event_date: string; payment_type: 'deposit' | 'full'; notes: string | null;
  };

  if (!body.first_name || !body.last_name || !body.email || !body.phone || !body.event_date || !body.payment_type) {
    return errorResponse('Missing required fields');
  }

  const existing = await env.DB.prepare(
    `SELECT id FROM reservations WHERE event_date = ? AND status = 'active'`
  ).bind(body.event_date).first();
  if (existing) return errorResponse('This date is already reserved');

  const totalAmount = getRate(body.event_date);
  const chargeAmount = body.payment_type === 'full' ? totalAmount : DEPOSIT_AMOUNT;

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: chargeAmount,
    currency: 'usd',
    payment_method_types: ['card', 'link'],
    metadata: {
      event_date: body.event_date,
      payment_type: body.payment_type,
      name: `${body.first_name} ${body.last_name}`,
    },
    receipt_email: body.email,
  });

  const result = await env.DB.prepare(
    `INSERT INTO reservations (first_name, last_name, email, phone, event_date, payment_type, notes, amount_total, amount_paid, stripe_payment_intent_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
  ).bind(
    body.first_name, body.last_name, body.email, body.phone,
    body.event_date, body.payment_type, body.notes,
    totalAmount, paymentIntent.id,
  ).run();

  return jsonResponse({ clientSecret: paymentIntent.client_secret, reservationId: result.meta.last_row_id });
}

async function createCheckReservation(request: Request, env: Env) {
  const body = await request.json() as {
    first_name: string; last_name: string; email: string; phone: string;
    event_date: string; notes: string | null;
  };

  if (!body.first_name || !body.last_name || !body.email || !body.phone || !body.event_date) {
    return errorResponse('Missing required fields');
  }

  const existing = await env.DB.prepare(
    `SELECT id FROM reservations WHERE event_date = ? AND status = 'active'`
  ).bind(body.event_date).first();
  if (existing) return errorResponse('This date is already reserved');

  const totalAmount = getRate(body.event_date);

  const result = await env.DB.prepare(
    `INSERT INTO reservations (first_name, last_name, email, phone, event_date, payment_type, notes, amount_total, amount_paid)
     VALUES (?, ?, ?, ?, ?, 'check', ?, ?, 0)`
  ).bind(body.first_name, body.last_name, body.email, body.phone, body.event_date, body.notes, totalAmount).run();

  await sendConfirmationEmail(env, {
    ...body,
    payment_type: 'check',
    amount_total: totalAmount,
    amount_paid: 0,
  });

  return jsonResponse({ reservationId: result.meta.last_row_id });
}

async function adminLogin(request: Request, env: Env) {
  const { username, password } = await request.json() as { username: string; password: string };
  if (!username || !password) return errorResponse('Username and password required');

  const admin = await env.DB.prepare(
    `SELECT * FROM admins WHERE username = ?`
  ).bind(username).first<{ id: number; username: string; password_hash: string }>();
  if (!admin) return errorResponse('Invalid credentials', 401);

  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) return errorResponse('Invalid credentials', 401);

  const token = await createJWT({ sub: admin.id, username: admin.username }, env.JWT_SECRET);
  return jsonResponse({ token });
}

async function stripeWebhook(request: Request, env: Env) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) return errorResponse('Missing signature', 400);

  const event = await verifyStripeSignature(body, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!event) return errorResponse('Invalid signature', 400);

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const reservation = await env.DB.prepare(
      `SELECT * FROM reservations WHERE stripe_payment_intent_id = ?`
    ).bind(pi.id).first<Record<string, unknown>>();

    if (reservation) {
      const amountPaid = pi.amount;
      const paidInFull = amountPaid >= (reservation.amount_total as number) ? 1 : 0;

      await env.DB.prepare(
        `UPDATE reservations SET amount_paid = ?, paid_in_full = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(amountPaid, paidInFull, reservation.id).run();

      await sendConfirmationEmail(env, {
        first_name: reservation.first_name as string,
        last_name: reservation.last_name as string,
        email: reservation.email as string,
        phone: reservation.phone as string,
        event_date: reservation.event_date as string,
        payment_type: reservation.payment_type as string,
        notes: reservation.notes as string | null,
        amount_total: reservation.amount_total as number,
        amount_paid: amountPaid,
      });
    }
  }

  return jsonResponse({ received: true });
}

// --- Admin routes ---

async function listReservations(request: Request, env: Env) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const filter = url.searchParams.get('filter') || 'upcoming';

  let query = `SELECT * FROM reservations`;
  if (filter === 'upcoming') query += ` WHERE event_date >= date('now') ORDER BY event_date ASC`;
  else if (filter === 'past') query += ` WHERE event_date < date('now') ORDER BY event_date DESC`;
  else query += ` ORDER BY event_date DESC`;

  const { results } = await env.DB.prepare(query).all();
  return jsonResponse({ reservations: results });
}

async function addReservation(request: Request, env: Env) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json() as Record<string, unknown>;

  const result = await env.DB.prepare(
    `INSERT INTO reservations (first_name, last_name, email, phone, event_date, payment_type, notes, paid_in_full, amount_total, amount_paid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    body.first_name || '', body.last_name || '', body.email || '', body.phone || '',
    body.event_date || '', body.payment_type || 'check', body.notes || null,
    body.paid_in_full || 0, body.amount_total || 0, body.amount_paid || 0,
  ).run();

  return jsonResponse({ reservationId: result.meta.last_row_id });
}

async function cancelReservation(request: Request, env: Env, id: string) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const reservation = await env.DB.prepare(`SELECT * FROM reservations WHERE id = ?`).bind(id).first<Record<string, unknown>>();
  if (!reservation) return errorResponse('Reservation not found', 404);
  if (reservation.status === 'cancelled') return errorResponse('Already cancelled');

  await env.DB.prepare(`UPDATE reservations SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`).bind(id).run();

  await sendCancellationEmail(env, {
    first_name: reservation.first_name as string,
    last_name: reservation.last_name as string,
    email: reservation.email as string,
    event_date: reservation.event_date as string,
  });

  return jsonResponse({ success: true });
}

async function refundReservation(request: Request, env: Env, id: string) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const reservation = await env.DB.prepare(`SELECT * FROM reservations WHERE id = ?`).bind(id).first<Record<string, unknown>>();
  if (!reservation) return errorResponse('Reservation not found', 404);
  if (!reservation.paid_in_full) return errorResponse('Can only refund reservations paid in full');
  if (!reservation.stripe_payment_intent_id) return errorResponse('No payment to refund');

  const refundAmount = (reservation.amount_total as number) - DEPOSIT_AMOUNT;
  if (refundAmount <= 0) return errorResponse('Nothing to refund');

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  await stripe.refunds.create({
    payment_intent: reservation.stripe_payment_intent_id as string,
    amount: refundAmount,
  });

  await env.DB.prepare(
    `UPDATE reservations SET paid_in_full = 0, amount_paid = ?, status = 'cancelled', updated_at = datetime('now') WHERE id = ?`
  ).bind(DEPOSIT_AMOUNT, id).run();

  await sendCancellationEmail(env, {
    first_name: reservation.first_name as string,
    last_name: reservation.last_name as string,
    email: reservation.email as string,
    event_date: reservation.event_date as string,
  }, `A refund of $${(refundAmount / 100).toFixed(2)} has been issued. The $500 deposit has been retained.`);

  return jsonResponse({ success: true });
}

async function sendInvoice(request: Request, env: Env, id: string) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const reservation = await env.DB.prepare(`SELECT * FROM reservations WHERE id = ?`).bind(id).first<Record<string, unknown>>();
  if (!reservation) return errorResponse('Reservation not found', 404);
  if (reservation.paid_in_full) return errorResponse('Already paid in full');

  await sendInvoiceEmail(env, {
    first_name: reservation.first_name as string,
    last_name: reservation.last_name as string,
    email: reservation.email as string,
    event_date: reservation.event_date as string,
    amount_total: reservation.amount_total as number,
    amount_paid: reservation.amount_paid as number,
  });

  return jsonResponse({ success: true });
}

async function markPaid(request: Request, env: Env, id: string) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const reservation = await env.DB.prepare(`SELECT * FROM reservations WHERE id = ?`).bind(id).first<Record<string, unknown>>();
  if (!reservation) return errorResponse('Reservation not found', 404);

  await env.DB.prepare(
    `UPDATE reservations SET paid_in_full = 1, amount_paid = amount_total, updated_at = datetime('now') WHERE id = ?`
  ).bind(id).run();

  return jsonResponse({ success: true });
}

// --- User management ---

async function listUsers(request: Request, env: Env) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const { results } = await env.DB.prepare(`SELECT id, username FROM admins ORDER BY id`).all<{ id: number; username: string }>();
  return jsonResponse({ users: results });
}

async function createUser(request: Request, env: Env) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const { username, password } = await request.json() as { username: string; password: string };
  if (!username?.trim() || !password?.trim()) return errorResponse('Username and password required');

  const existing = await env.DB.prepare(`SELECT id FROM admins WHERE username = ?`).bind(username).first();
  if (existing) return errorResponse('Username already exists');

  const hash = await hashPassword(password);
  await env.DB.prepare(`INSERT INTO admins (username, password_hash) VALUES (?, ?)`).bind(username, hash).run();

  return jsonResponse({ success: true });
}

async function deleteUser(request: Request, env: Env, id: string) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const count = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM admins`).first<{ cnt: number }>();
  if (count && count.cnt <= 1) return errorResponse('Cannot delete the last admin user');

  await env.DB.prepare(`DELETE FROM admins WHERE id = ?`).bind(id).run();
  return jsonResponse({ success: true });
}

async function updateUserPassword(request: Request, env: Env, id: string) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const { password } = await request.json() as { password: string };
  if (!password?.trim()) return errorResponse('Password required');

  const hash = await hashPassword(password);
  await env.DB.prepare(`UPDATE admins SET password_hash = ? WHERE id = ?`).bind(hash, id).run();

  return jsonResponse({ success: true });
}

// --- Stripe signature verification ---

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<Stripe.Event | null> {
  const parts = sigHeader.split(',');
  let timestamp = '';
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value;
    if (key === 'v1') signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return null;
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) return null;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`));
  const expected = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('');

  if (!signatures.includes(expected)) return null;
  return JSON.parse(payload) as Stripe.Event;
}

// --- Scheduled handler ---

async function handleScheduled(env: Env) {
  const invoiceDue = await env.DB.prepare(
    `SELECT * FROM reservations
     WHERE status = 'active' AND paid_in_full = 0 AND payment_type != 'check'
       AND invoice_sent = 0 AND event_date <= date('now', '+30 days') AND event_date >= date('now')`
  ).all<Record<string, unknown>>();

  for (const r of invoiceDue.results) {
    await sendInvoiceEmail(env, r as any);
    await env.DB.prepare(`UPDATE reservations SET invoice_sent = 1, updated_at = datetime('now') WHERE id = ?`).bind(r.id).run();
  }

  const concernDue = await env.DB.prepare(
    `SELECT * FROM reservations
     WHERE status = 'active' AND paid_in_full = 0 AND concern_sent = 0
       AND event_date <= date('now', '+7 days') AND event_date >= date('now')`
  ).all<Record<string, unknown>>();

  for (const r of concernDue.results) {
    await sendInvoiceEmail(env, r as any);
    await sendConcernEmail(env, r as any);
    await env.DB.prepare(`UPDATE reservations SET concern_sent = 1, updated_at = datetime('now') WHERE id = ?`).bind(r.id).run();
  }
}

export default {
  fetch: handleRequest,
  scheduled: (_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) => handleScheduled(env),
} satisfies ExportedHandler<Env>;
