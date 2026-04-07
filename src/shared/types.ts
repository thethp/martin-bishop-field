export interface Reservation {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  event_date: string;
  payment_type: 'deposit' | 'full' | 'check';
  notes: string | null;
  paid_in_full: number;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  amount_total: number;
  amount_paid: number;
  status: 'active' | 'cancelled';
  invoice_sent: number;
  concern_sent: number;
  created_at: string;
  updated_at: string;
}
