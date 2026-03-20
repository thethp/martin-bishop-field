import { useState } from 'react';
import './Faqs.css';

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

export function FaqsSection() {
  return (
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
  );
}