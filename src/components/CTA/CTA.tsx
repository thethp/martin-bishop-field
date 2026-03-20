import './CTA.css';

export function CTASection() {
  return (
    <section className="section section-cta">
      <div className="container">
        <h2>Ready to Book Your Event?</h2>
        <p>
          Check availability and reserve Martin-Bishop Field for your next gathering in Guilford, CT.
        </p>
        <div className="cta-actions">
          <a href="/reserve" className="btn btn-primary btn-large">Reserve the Field</a>
        </div>
      </div>
    </section>
  );
}