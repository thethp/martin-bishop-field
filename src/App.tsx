import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Header, Footer } from './components/Navbars';

const HERO_IMAGES = [
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160506.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2021/05/6dbc31b9-4353-4884-bf10-3e6e552659ef.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160515.jpeg',
];

const GALLERY_IMAGES = [
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160517.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160516.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160515.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160512.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160507.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160506.jpeg',
];

const FAQS = [
  {
    q: 'Where is the field?',
    a: 'Martin-Bishop Field is located at 111 Long Hill Rd, Guilford, CT 06437. You can find us on Google Maps or call (203) 507-9645 for directions.',
  },
  {
    q: 'How much does it cost to rent the field?',
    a: 'Rental rates are: Saturday, Sunday & Holidays — $1,300 · Friday — $850 · Monday through Thursday — $550. A non-refundable $500 deposit is due upon reservation, with the final balance due within 21 days.',
  },
  {
    q: 'What are the field hours?',
    a: 'The field opens at 8:00 AM. Restrooms and refrigerators are accessible from 10:00 AM. All events must wrap up by 10:00 PM.',
  },
  {
    q: 'Is alcohol permitted?',
    a: 'Yes. Alcohol is permitted provided you observe all state and town laws regarding its distribution and consumption. You are solely responsible for the safety of your guests — drink responsibly.',
  },
  {
    q: 'Can we have live music or a band?',
    a: 'Yes, provided the music is kept at a reasonable level with respect to our neighbors. Per the Town Noise Ordinance, all music must cease at 10:00 PM.',
  },
  {
    q: 'Are pets allowed?',
    a: 'Yes, provided you and your guests are responsible pet owners and pick up and properly dispose of all waste.',
  },
  {
    q: 'Can we decorate the pavilion?',
    a: 'Decorations are allowed provided that no staples, tacks, or permanent fasteners are used. Please remove and dispose of all decorations at the event\'s conclusion.',
  },
  {
    q: 'What are my cleanup responsibilities?',
    a: 'All trash goes in the dumpsters, refrigerators must be emptied of all food and beverage, and the field should be left in the condition you found it. Return all tables to their original positions if moved, ensure smokers dispose of butts properly using the provided containers, and please use only the supplied toilet paper.',
  },
  {
    q: 'What sports equipment is available?',
    a: 'We have horseshoe pits with shoes, a volleyball net, badminton rackets, a basketball hoop, and a softball backstop. Please bring your own volleyball, basketball, birdies, and softball equipment.',
  },
  {
    q: 'Who do I contact in an emergency?',
    a: 'You may call Michael at (203) 507-9645 or Stephen at (203) 907-5942.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const answerId = `faq-${q.slice(0, 24).replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button
        className="faq-question"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={answerId}
      >
        <span>{q}</span>
        <span className="faq-icon" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="faq-answer" id={answerId}>{a}</p>}
    </div>
  );
}

function Hero() {
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
          <a href="/reserve" className="btn-primary btn-large">Reserve the Field</a>
        </div>
        <button className="hero-arrow left" onClick={prev} aria-label="Previous photo">&#8249;</button>
        <button className="hero-arrow right" onClick={next} aria-label="Next photo">&#8250;</button>
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

function GalleryModal({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) {
  const [idx, setIdx] = useState(index);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  // Initial focus on the close button
  useEffect(() => { closeRef.current?.focus(); }, []);

  // Keyboard navigation + focus trap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowLeft'  || e.key === 'j') { prev(); return; }
      if (e.key === 'ArrowRight' || e.key === 'k') { next(); return; }

      if (e.key === 'Tab') {
        const focusable = Array.from(
          modalRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
          ) ?? []
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, idx]);

  return (
    <div
      ref={modalRef}
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${idx + 1} of ${images.length}`}
    >
      <button ref={closeRef} className="modal-close" onClick={onClose} aria-label="Close photo viewer">&times;</button>
      <button className="modal-arrow left"  onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous photo">&#8249;</button>
      <img
        className="modal-img"
        src={images[idx]}
        alt={`Martin-Bishop Field event photo ${idx + 1} of ${images.length}`}
        onClick={e => e.stopPropagation()}
      />
      <button className="modal-arrow right" onClick={e => { e.stopPropagation(); next(); }} aria-label="Next photo">&#8250;</button>
      <div className="modal-dots" role="group" aria-label="Photo navigation">
        {images.map((_, i) => (
          <button
            key={i}
            className={`dot${i === idx ? ' active' : ''}`}
            onClick={e => { e.stopPropagation(); setIdx(i); }}
            aria-label={`Go to photo ${i + 1}`}
            aria-current={i === idx ? 'true' : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openModal = (i: number) => {
    triggerRef.current = document.activeElement as HTMLElement;
    setModalIndex(i);
  };

  const closeModal = () => {
    setModalIndex(null);
    triggerRef.current?.focus();
  };

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header />
      <main id="main-content">
        <Hero />

        {/* About / Event Types */}
        <section id="events" className="section section-white">
          <div className="container">
            <h2>The Perfect Setting for Every Occasion</h2>
            <p className="section-sub">
              Nestled along Connecticut's shoreline, Martin-Bishop Field — also known as Fireman's Field — has been
              Guilford's most beloved outdoor gathering place since 1959. Spacious, flexible, and full of character.
            </p>
            <div className="card-grid">
              <div className="event-card">
                <div className="event-card-bar"></div>
                <h3>Weddings</h3>
                <p>
                  Say "I do" in the open air. Our beautiful grounds provide an ideal backdrop for outdoor ceremonies,
                  al fresco receptions, and everything in between.
                </p>
              </div>
              <div className="event-card">
                <div className="event-card-bar"></div>
                <h3>Family Reunions</h3>
                <p>
                  Bring everyone together. With sports facilities, wide open green space, and full on-site amenities,
                  there's room for every generation to enjoy the day.
                </p>
              </div>
              <div className="event-card">
                <div className="event-card-bar"></div>
                <h3>Parties &amp; Gatherings</h3>
                <p>
                  Birthdays, graduations, community events — whatever the occasion, our versatile venue accommodates
                  parties of all sizes and styles.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Amenities */}
        <section id="amenities" className="section section-green">
          <div className="container">
            <h2>What's On-Site</h2>
            <p className="section-sub">Everything you need for a great event, already here.</p>
            <div className="amenity-grid">
              {[
                'Softball Backstop',
                'Basketball Hoop',
                'Volleyball Net',
                'Badminton Rackets',
                'Horseshoe Pits',
                'Restrooms',
                'Refrigerators',
                'Trash Dumpsters',
              ].map((label) => (
                <div key={label} className="amenity-item">{label}</div>
              ))}
            </div>
            <div className="amenity-notes">
              <span>Pets welcome</span>
              <span>Decorations allowed</span>
              <span>Alcohol permitted</span>
              <span>Live music welcome</span>
            </div>
          </div>
        </section>

        {/* How to Reserve */}
        <section id="reserve" className="section section-cream">
          <div className="container">
            <h2>How to Reserve</h2>
            <p className="section-sub">Booking is straightforward. Here's how it works.</p>
            <div className="steps">
              {[
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
              ].map(({ n, title, desc }) => (
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

        {/* Details */}
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

        {/* Gallery */}
        <section id="gallery" className="section section-cream">
          <div className="container">
            <h2>See the Field</h2>
            <p className="section-sub">
              From intimate ceremonies to lively family reunions — here's what your event could look like.
            </p>
            <div className="gallery-grid">
              {GALLERY_IMAGES.map((src, i) => (
                <button
                  key={i}
                  className="gallery-item"
                  style={{ backgroundImage: `url(${src})` }}
                  aria-label={`View event photo ${i + 1}`}
                  onClick={() => openModal(i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section section-white">
          <div className="container container-narrow">
            <h2>Frequently Asked Questions</h2>
            <p className="section-sub">Have a question? We probably have the answer.</p>
            <div className="faq-list">
              {FAQS.map(({ q, a }) => (
                <FAQItem key={q} q={q} a={a} />
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="section section-cta">
          <div className="container">
            <h2>Ready to Book Your Event?</h2>
            <p>
              Check availability and reserve Martin-Bishop Field for your next gathering in Guilford, CT.
            </p>
            <div className="cta-actions">
              <a href="/reserve" className="btn-primary btn-large">Reserve the Field</a>
              <a href="tel:203-507-9645" className="btn-outline btn-large">(203) 507-9645</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      {modalIndex !== null && <GalleryModal images={GALLERY_IMAGES} index={modalIndex} onClose={closeModal} />}
    </>
  );
}

export default App;
