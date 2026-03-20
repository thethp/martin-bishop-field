import './Reserve.css';

const RESERVE_CARDS = [
  {
    n: '01',
    title: 'Check the Calendar',
    desc: 'Browse our availability calendar to find a date that works for your event.',
  },
  {
    n: '02',
    title: 'Review Guidelines',
    desc: 'Read through our rental guidelines so there are no surprises on your big day.',
  },
  {
    n: '03',
    title: 'Submit a Request',
    desc: 'Fill out the reservation request form with your event details and contact info.',
  },
  {
    n: '04',
    title: 'Confirm & Pay',
    desc: 'Receive your confirmation and send your $500 deposit to lock in your date.',
  },
];

export function ReserveSection() { 
  return (
    <section id="reserve" className="section section-cream">
      <div className="container">
        <h2>How to Reserve</h2>
        <p className="section-sub">Booking is straightforward. Here's how it works.</p>
        <div className="steps">
          {RESERVE_CARDS.map(({ n, title, desc }) => (
            <div key={n} className="step">
              <div className="step-number">{n}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <a href="/reserve" className="btn-green">Start Your Reservation</a>
        </div>
      </div>
    </section>
  );
}