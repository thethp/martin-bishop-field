import { useState, useRef, useCallback } from 'react';
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
  const [paymentType, setPaymentType] = useState<'deposit' | 'full' | 'check'>('deposit');
  const [paymentReady, setPaymentReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const clientSecretRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const paymentRef = useRef<PaymentHandle>(null);

  const rate = selectedDate ? getRate(selectedDate) : 0;
  const isCardPayment = paymentType !== 'check';

  const handlePhoneInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatPhone(e.target.value);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !formRef.current) return;

    const fd = new FormData(formRef.current);
    const firstName = (fd.get('firstName') as string || '').trim();
    const lastName = (fd.get('lastName') as string || '').trim();
    const email = (fd.get('email') as string || '').trim();
    const phone = (fd.get('phone') as string || '').trim();
    const notes = (fd.get('notes') as string || '').trim() || null;

    if (!firstName || !lastName || !email || !phone || !selectedDate) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (isCardPayment && !paymentReady) return;

    setSubmitting(true);

    try {
      if (paymentType === 'check') {
        const res = await fetch('/api/reservations/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: firstName, last_name: lastName,
            email, phone, event_date: selectedDate,
            payment_type: 'check', notes,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create reservation');
        }
        onSuccess({ firstName, email, date: selectedDate, paymentType: 'check' });
      } else {
        let secret = clientSecretRef.current;
        if (!secret) {
          const res = await fetch('/api/reservations/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: firstName, last_name: lastName,
              email, phone, event_date: selectedDate,
              payment_type: paymentType, notes,
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
        onSuccess({ firstName, email, date: selectedDate, paymentType });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="reservation-form" onSubmit={handleSubmit} ref={formRef} noValidate>
      <div className="form-row">
        <label className="form-field">
          <span className="form-label">First name</span>
          <input type="text" name="firstName" required autoComplete="given-name" />
        </label>
        <label className="form-field">
          <span className="form-label">Last name</span>
          <input type="text" name="lastName" required autoComplete="family-name" />
        </label>
      </div>

      <label className="form-field">
        <span className="form-label">E-mail</span>
        <input type="email" name="email" required autoComplete="email" />
      </label>

      <label className="form-field">
        <span className="form-label">Phone number</span>
        <input type="tel" name="phone" required autoComplete="tel" onChange={handlePhoneInput} />
      </label>

      <label className="form-field">
        <span className="form-label">Notes <span className="form-optional">(optional)</span></span>
        <textarea name="notes" rows={3} />
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
                checked={paymentType === 'deposit'}
                onChange={() => setPaymentType('deposit')}
              />
              <span>Pay deposit ({formatCents(DEPOSIT_AMOUNT)})</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="paymentType"
                value="full"
                checked={paymentType === 'full'}
                onChange={() => setPaymentType('full')}
              />
              <span>Pay in full ({formatCents(rate)})</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="paymentType"
                value="check"
                checked={paymentType === 'check'}
                onChange={() => setPaymentType('check')}
              />
              <span>Pay by check</span>
            </label>
          </fieldset>

          {paymentType === 'check' && (
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
        type="submit"
        className="btn btn-primary btn-large reserve-submit"
        disabled={submitting || !selectedDate || (isCardPayment && !paymentReady)}
      >
        {submitting ? 'Processing…' : 'Submit Reservation'}
      </button>
    </form>
  );
}
