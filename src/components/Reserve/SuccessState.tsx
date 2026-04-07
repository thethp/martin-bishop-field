interface SuccessStateProps {
  firstName: string;
  email: string;
  date: string;
  paymentType: 'deposit' | 'full' | 'check';
}

export function SuccessState({ firstName, email, date, paymentType }: SuccessStateProps) {
  const formatted = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="reserve-success">
      <div className="success-icon">&#10003;</div>
      <h3>Reservation Confirmed!</h3>
      <p>
        Thank you, {firstName}! Your reservation for <strong>{formatted}</strong> has been received.
      </p>
      <p>A confirmation email has been sent to <strong>{email}</strong>.</p>
      {paymentType === 'check' && (
        <p className="success-note">
          Please send your $500 deposit check within 5 business days.
          Mailing details are included in your confirmation email.
        </p>
      )}
      {paymentType === 'deposit' && (
        <p className="success-note">
          Your $500 deposit has been processed. The remaining balance is due within 30 days of your event.
        </p>
      )}
      {paymentType === 'full' && (
        <p className="success-note">
          Your payment has been processed in full. You're all set!
        </p>
      )}
    </div>
  );
}
