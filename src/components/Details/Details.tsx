import './details.css';

export function DetailsSection() {
  return (
    <section id="details" className="section section-white">
      <div className="container">
        <h2>Good to Know</h2>
        <p className="section-sub">Key details about renting the field.</p>
        <div className="details-grid">
          <div className="detail-block">
            <h3>Hours</h3>
            <p>
              Field opens at <strong>8:00 AM</strong><br />
              Restrooms &amp; refrigerators from <strong>10:00 AM</strong><br />
              All events close by <strong>10:00 PM</strong>
            </p>
          </div>
          <div className="detail-block">
            <h3>Pricing &amp; Payment</h3>
            <p>
              Sat / Sun / Holidays — <strong>$1,300</strong><br />
              Friday — <strong>$850</strong><br />
              Mon – Thu — <strong>$550</strong><br />
              <br />
              $500 non-refundable deposit due upon reservation. Full balance due within 21 days.
            </p>
          </div>
          <div className="detail-block">
            <h3>Music &amp; Entertainment</h3>
            <p>
              Live music and DJs are welcome. Volumes must stay reasonable out
              of respect for neighbors. All music must end by{' '}
              <strong>10:00 PM</strong> per Guilford town ordinance.
            </p>
          </div>
          <div className="detail-block">
            <h3>Location</h3>
            <p>
              111 Long Hill Rd<br />
              Guilford, CT 06437<br />
              <br />
              <a
                href="https://maps.app.goo.gl/xKt3pTsxmiZsGXkB6"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions &rarr;
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}