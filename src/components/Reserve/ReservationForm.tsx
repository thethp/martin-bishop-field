import { useState, useRef } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { PaymentSection } from './PaymentSection';
import type { PaymentHandle } from './PaymentSection';
import { getRate, formatCents, DEPOSIT_AMOUNT } from '../../shared/pricing';
import './ReservationForm.css';

const ELEMENTS_OPTIONS = {
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#4F6F52',
      colorBackground: '#ffffff',
      colorText: '#1e2d1e',
      colorDanger: '#7A2E2E',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '6px',
    },
  },
  mode: 'payment' as const,
  amount: 50000,
  currency: 'usd',
  payment_method_types: ['card', 'link'] as string[],
};

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
  paymentType: 'deposit' | 'full' | 'check';
}

interface ReservationFormProps {
  selectedDate: string;
  stripePromise: Promise<Stripe | null>;
  onSuccess: (data: { firstName: string; email: string; date: string; paymentType: 'deposit' | 'full' | 'check' }) => void;
  onError: (message: string) => void;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function ReservationForm({ selectedDate, stripePromise, onSuccess, onError }: ReservationFormProps) {
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    paymentType: 'deposit',
  });
  const [paymentReady, setPaymentReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const clientSecretRef = useRef<string | null>(null);
  const paymentRef = useRef<PaymentHandle>(null);

  const rate = selectedDate ? getRate(selectedDate) : 0;
  const isCardPayment = form.paymentType !== 'check';

  const set = (key: keyof FormData, value: string) =>
    setForm(f => ({ ...f, [key]: key === 'phone' ? formatPhone(value) : value }));

  const formValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.phone.trim() &&
    selectedDate &&
    (!isCardPayment || paymentReady);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formValid || submitting) return;

    setSubmitting(true);

    try {
      if (form.paymentType === 'check') {
        const res = await fetch('/api/reservations/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: form.firstName,
            last_name: form.lastName,
            email: form.email,
            phone: form.phone,
            event_date: selectedDate,
            payment_type: 'check',
            notes: form.notes || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create reservation');
        }
        onSuccess({ firstName: form.firstName, email: form.email, date: selectedDate, paymentType: 'check' });
      } else {
        let secret = clientSecretRef.current;
        if (!secret) {
          const res = await fetch('/api/reservations/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: form.firstName,
              last_name: form.lastName,
              email: form.email,
              phone: form.phone,
              event_date: selectedDate,
              payment_type: form.paymentType,
              notes: form.notes || null,
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to create payment');
          }
          const data = await res.json();
          secret = data.clientSecret;
          clientSecretRef.current = secret;
        }

        await paymentRef.current!.confirmPayment(secret!);
        onSuccess({ firstName: form.firstName, email: form.email, date: selectedDate, paymentType: form.paymentType });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="reservation-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <label className="form-field">
          <span className="form-label">First name</span>
          <input
            type="text"
            value={form.firstName}
            onChange={e => set('firstName', e.target.value)}
            required
            autoComplete="given-name"
          />
        </label>
        <label className="form-field">
          <span className="form-label">Last name</span>
          <input
            type="text"
            value={form.lastName}
            onChange={e => set('lastName', e.target.value)}
            required
            autoComplete="family-name"
          />
        </label>
      </div>

      <label className="form-field">
        <span className="form-label">E-mail</span>
        <input
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          required
          autoComplete="email"
        />
      </label>

      <label className="form-field">
        <span className="form-label">Phone number</span>
        <input
          type="tel"
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
          required
          autoComplete="tel"
        />
      </label>

      <label className="form-field">
        <span className="form-label">Notes <span className="form-optional">(optional)</span></span>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={3}
        />
      </label>

      {selectedDate && (
        <>
          <fieldset className="payment-options">
            <legend className="form-label">Payment</legend>
            <label className="radio-option">
              <input
                type="radio"
                name="paymentType"
                value="deposit"
                checked={form.paymentType === 'deposit'}
                onChange={() => set('paymentType', 'deposit')}
              />
              <span>Pay deposit ({formatCents(DEPOSIT_AMOUNT)})</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="paymentType"
                value="full"
                checked={form.paymentType === 'full'}
                onChange={() => set('paymentType', 'full')}
              />
              <span>Pay in full ({formatCents(rate)})</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="paymentType"
                value="check"
                checked={form.paymentType === 'check'}
                onChange={() => set('paymentType', 'check')}
              />
              <span>Pay by check</span>
            </label>
          </fieldset>

          {form.paymentType === 'check' && (
            <div className="check-info-box">
              A $500 deposit check is due within 5 business days of your reservation request. Details on where to send it will arrive via email.
            </div>
          )}

          {isCardPayment && (
            <Elements stripe={stripePromise} options={ELEMENTS_OPTIONS}>
              <PaymentSection ref={paymentRef} onReady={setPaymentReady} />
            </Elements>
          )}

          <p className="balance-note">
            The full balance is due within 30 days of your event.
          </p>
        </>
      )}

      <button
        type="button"
        className="btn btn-primary btn-large reserve-submit"
        disabled={!formValid || submitting}
        onClick={() => handleSubmit()}
      >
        {submitting ? 'Processing…' : 'Submit Reservation'}
      </button>
    </form>
  );
}
