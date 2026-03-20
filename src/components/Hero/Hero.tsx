import { useState, useEffect } from 'react';
import './Hero.css';

const HERO_IMAGES = [
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160506.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2021/05/6dbc31b9-4353-4884-bf10-3e6e552659ef.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160515.jpeg',
];

export function Hero() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx(i => (i + 1) % HERO_IMAGES.length), 5500);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setIdx(i => (i - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
  const next = () => setIdx(i => (i + 1) % HERO_IMAGES.length);

  return (
    <section
      className="hero"
      style={{ backgroundImage: `url(${HERO_IMAGES[idx]})` }}
      aria-label="Martin-Bishop Field outdoor event venue in Guilford CT"
    >
      <div className="hero-overlay">
        <div className="hero-content">
          <p className="hero-label">Guilford, Connecticut &nbsp;&middot;&nbsp; Est. 1959</p>
          <h1>Your Perfect Outdoor<br />Event Venue</h1>
          <p className="hero-sub">
            Weddings &nbsp;&middot;&nbsp; Family Reunions &nbsp;&middot;&nbsp; Private Parties<br />
            111 Long Hill Rd, Guilford, CT 06437
          </p>
          <a href="/reserve" className="btn btn-primary btn-large">Reserve the Field</a>
        </div>
        <button className="btn-glass hero-arrow left" onClick={prev} aria-label="Previous photo">&#8249;</button>
        <button className="btn-glass hero-arrow right" onClick={next} aria-label="Next photo">&#8250;</button>
        <div className="hero-dots">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              className={`dot${i === idx ? ' active' : ''}`}
              onClick={() => setIdx(i)}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}