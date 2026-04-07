interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="reserve-error">
      <div className="error-icon">!</div>
      <h3>Something went wrong</h3>
      <p>{message}</p>
      <button className="btn btn-primary" onClick={onRetry}>Try Again</button>
    </div>
  );
}
