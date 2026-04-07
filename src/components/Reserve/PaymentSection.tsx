import { memo } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './PaymentSection.css';

interface PaymentSectionProps {
  onReady: (ready: boolean) => void;
}

const LAYOUT_OPTIONS = { layout: 'tabs' as const };

export const PaymentSection = memo(function PaymentSection({ onReady }: PaymentSectionProps) {
  return (
    <div className="payment-section">
      <PaymentElement
        onChange={(e) => onReady(e.complete)}
        options={LAYOUT_OPTIONS}
      />
    </div>
  );
});

export function usePayment() {
  const stripe = useStripe();
  const elements = useElements();

  const confirmPayment = async (clientSecret: string) => {
    if (!stripe || !elements) throw new Error('Stripe not loaded');

    const { error: submitError } = await elements.submit();
    if (submitError) throw submitError;

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: window.location.origin + '/#reserve',
      },
      redirect: 'if_required',
    });

    if (error) throw error;
  };

  return { confirmPayment, ready: !!stripe && !!elements };
}
