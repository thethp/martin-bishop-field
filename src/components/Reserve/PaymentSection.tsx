import { memo, useImperativeHandle, forwardRef } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './PaymentSection.css';

const LAYOUT_OPTIONS = { layout: 'tabs' as const };

export interface PaymentHandle {
  confirmPayment: (clientSecret: string) => Promise<void>;
}

export const PaymentSection = memo(forwardRef<PaymentHandle, { onReady: (ready: boolean) => void }>(
  function PaymentSection({ onReady }, ref) {
    const stripe = useStripe();
    const elements = useElements();

    useImperativeHandle(ref, () => ({
      confirmPayment: async (clientSecret: string) => {
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
      },
    }), [stripe, elements]);

    return (
      <div className="payment-section">
        <PaymentElement
          onChange={(e) => onReady(e.complete)}
          options={LAYOUT_OPTIONS}
        />
      </div>
    );
  }
));
