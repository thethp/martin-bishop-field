export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  JWT_SECRET: string;
  SITE_URL: string;
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(error: string, status = 400) {
  return jsonResponse({ error }, status);
}

export const DEPOSIT_AMOUNT = 50000;

export function getRate(dateStr: string): number {
  const day = new Date(dateStr + 'T12:00:00').getDay();
  if (day === 0 || day === 6) return 130000;
  if (day === 5) return 85000;
  return 55000;
}

// JWT
export async function createJWT(payload: Record<string, unknown>, secret: string, expiresInHours = 24): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInHours * 3600 };
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '');
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${data}.${sigB64}`;
}

export async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigB64 = parts[2].replace(/-/g, '+').replace(/_/g, '/');
    const sigPadded = sigB64 + '='.repeat((4 - sigB64.length % 4) % 4);
    const sig = Uint8Array.from(atob(sigPadded), c => c.charCodeAt(0));
    const data = `${parts[0]}.${parts[1]}`;
    const valid = await crypto.subtle.verify('HMAC', key, sig, encoder.encode(data));
    if (!valid) return null;
    const payloadB64 = parts[1] + '='.repeat((4 - parts[1].length % 4) % 4);
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const hash = new Uint8Array(bits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const computed = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computed === hashHex;
}

// Auth middleware
export async function requireAuth(request: Request, env: Env): Promise<Record<string, unknown> | Response> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return errorResponse('Unauthorized', 401);
  const payload = await verifyJWT(auth.slice(7), env.JWT_SECRET);
  if (!payload) return errorResponse('Unauthorized', 401);
  return payload;
}

// Email
const FIELD_EMAIL = 'martinbishopfield@gmail.com';

export async function sendEmail(env: Env, opts: { to: string[]; cc?: string[]; subject: string; html: string }) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: 'Martin-Bishop Field <noreply@martin-bishopfield.com>',
      to: opts.to,
      cc: opts.cc,
      subject: opts.subject,
      html: opts.html,
    }),
  });
}

export function sendConfirmationEmail(env: Env, r: {
  first_name: string; last_name: string; email: string; phone: string;
  event_date: string; payment_type: string; notes: string | null;
  amount_total: number; amount_paid: number;
}) {
  const date = new Date(r.event_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const checkInfo = r.payment_type === 'check'
    ? `<p><strong>Check Payment Instructions:</strong><br>Please mail a $500 deposit check within 5 business days.<br>Make payable to: [PAYEE PLACEHOLDER]<br>Mail to: [ADDRESS PLACEHOLDER]</p>`
    : '';
  const paymentStatus = r.amount_paid >= r.amount_total
    ? 'Paid in full'
    : r.payment_type === 'check'
    ? 'Check payment pending'
    : `$${(r.amount_paid / 100).toFixed(2)} paid — balance of $${((r.amount_total - r.amount_paid) / 100).toFixed(2)} due within 30 days of event`;

  return sendEmail(env, {
    to: [r.email, FIELD_EMAIL],
    subject: `Reservation Confirmed — Martin-Bishop Field — ${date}`,
    html: `<h2>Reservation Confirmed</h2>
      <p>A reservation has been made for Martin-Bishop Field.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold">Date</td><td>${date}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold">Name</td><td>${r.first_name} ${r.last_name}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold">Email</td><td>${r.email}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold">Phone</td><td>${r.phone}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold">Payment</td><td>${paymentStatus}</td></tr>
        ${r.notes ? `<tr><td style="padding:6px 16px 6px 0;font-weight:bold">Notes</td><td>${r.notes}</td></tr>` : ''}
      </table>
      ${checkInfo}
      <p style="color:#666;font-size:13px">The full balance is due within 30 days of the event.</p>`,
  });
}

export function sendCancellationEmail(env: Env, r: { first_name: string; last_name: string; email: string; event_date: string }, refundInfo?: string) {
  const date = new Date(r.event_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return sendEmail(env, {
    to: [r.email, FIELD_EMAIL],
    subject: `Reservation Cancelled — Martin-Bishop Field — ${date}`,
    html: `<h2>Reservation Cancelled</h2><p>The reservation for <strong>${date}</strong> for ${r.first_name} ${r.last_name} has been cancelled.</p>${refundInfo ? `<p>${refundInfo}</p>` : ''}`,
  });
}

export function sendInvoiceEmail(env: Env, r: { first_name: string; last_name: string; email: string; event_date: string; amount_total: number; amount_paid: number }) {
  const date = new Date(r.event_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const balance = ((r.amount_total - r.amount_paid) / 100).toFixed(2);
  return sendEmail(env, {
    to: [r.email],
    cc: [FIELD_EMAIL],
    subject: `Balance Due — Martin-Bishop Field — ${date}`,
    html: `<h2>Balance Due — Martin-Bishop Field</h2>
      <p>Hi ${r.first_name},</p>
      <p>This is a reminder that the remaining balance of <strong>$${balance}</strong> is due for your reservation on <strong>${date}</strong>.</p>
      <p>Please contact us at martinbishopfield@gmail.com to arrange payment.</p>
      <p>You may also pay by check:<br>Make payable to: [PAYEE PLACEHOLDER]<br>Mail to: [ADDRESS PLACEHOLDER]</p>`,
  });
}

export function sendConcernEmail(env: Env, r: { first_name: string; last_name: string; email: string; phone: string; event_date: string; amount_total: number; amount_paid: number }) {
  const date = new Date(r.event_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const balance = ((r.amount_total - r.amount_paid) / 100).toFixed(2);
  return sendEmail(env, {
    to: [FIELD_EMAIL],
    subject: `⚠ Unpaid Reservation — ${r.first_name} ${r.last_name} — ${date}`,
    html: `<h2>⚠ Unpaid Reservation Alert</h2>
      <p>The following reservation is within 7 days and has not been paid in full:</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold">Date</td><td>${date}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold">Name</td><td>${r.first_name} ${r.last_name}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold">Email</td><td>${r.email}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold">Phone</td><td>${r.phone}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold">Outstanding</td><td>$${balance}</td></tr>
      </table>`,
  });
}
