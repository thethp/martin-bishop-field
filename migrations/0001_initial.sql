CREATE TABLE reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_date TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  notes TEXT,
  paid_in_full INTEGER DEFAULT 0,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  amount_total INTEGER NOT NULL,
  amount_paid INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  invoice_sent INTEGER DEFAULT 0,
  concern_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_reservations_date ON reservations(event_date);
CREATE INDEX idx_reservations_status ON reservations(status);

CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);
