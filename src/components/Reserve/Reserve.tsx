import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { Calendar } from './Calendar';
import { ReservationForm } from './ReservationForm';
import { SuccessState } from './SuccessState';
import { ErrorState } from './ErrorState';
import './Reserve.css';

const stripePromise: Promise<Stripe | null> = fetch('/api/config')
  .then(r => {
    if (!r.ok) throw new Error('config fetch failed');
    return r.json();
  })
  .then(data => data.stripePublishableKey ? loadStripe(data.stripePublishableKey) : null)
  .catch(() => null);

export function ReserveSection() {
  const [selectedDate, setSelectedDate] = useState('');
  const [reservedDates, setReservedDates] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<
    | null
    | { type: 'success'; firstName: string; email: string; date: string; paymentType: 'deposit' | 'full' | 'check' }
    | { type: 'error'; message: string }
  >(null);

  useEffect(() => {
    fetch('/api/reservations/dates')
      .then(r => r.json())
      .then(data => setReservedDates(new Set(data.dates || [])))
      .catch(() => {});
  }, []);

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && !reservedDates.has(val)) {
      setSelectedDate(val);
    }
  };

  if (result?.type === 'success') {
    return (
      <section id="reserve" className="section section-cream">
        <div className="container container-narrow">
          <SuccessState
            firstName={result.firstName}
            email={result.email}
            date={result.date}
            paymentType={result.paymentType}
          />
        </div>
      </section>
    );
  }

  if (result?.type === 'error') {
    return (
      <section id="reserve" className="section section-cream">
        <div className="container container-narrow">
          <ErrorState
            message={result.message}
            onRetry={() => setResult(null)}
          />
        </div>
      </section>
    );
  }

  return (
    <section id="reserve" className="section section-cream">
      <div className="container">
        <h2>Reserve the Field</h2>
        <p className="section-sub">Select your date and fill out the form below to book Martin-Bishop Field.</p>

        <div className="reserve-layout">
          <div className="reserve-left">
            <label className="form-field date-input-field">
              <span className="form-label">Event date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateInput}
                min={new Date().toISOString().split('T')[0]}
              />
            </label>
            <Calendar
              reservedDates={reservedDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
          <div className="reserve-right">
            <ReservationForm
              selectedDate={selectedDate}
              stripePromise={stripePromise}
              onSuccess={useCallback((data: { firstName: string; email: string; date: string; paymentType: 'deposit' | 'full' | 'check' }) => setResult({ type: 'success', ...data }), [])}
              onError={useCallback((message: string) => setResult({ type: 'error', message }), [])}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
