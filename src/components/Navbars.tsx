import { useState, useEffect } from 'react';
import logo from '/logo.svg';
import './Navbars.css';

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={scrolled ? 'scrolled' : ''}>
      <a href="/" className="header-brand">
        <img src={logo} className="logo" alt="Martin-Bishop Field" />
        <div className="title">
          <span className="title-main">Martin-Bishop Field</span>
          <span className="title-sub">Guilford, CT &nbsp;&middot;&nbsp; Est. 1959</span>
        </div>
      </a>
      <nav>
        <a href="#events">About</a>
        <a href="#amenities">Amenities</a>
        <a href="#gallery">Gallery</a>
        <a href="#faq">FAQ</a>
        <a href="/reserve" className="nav-cta">Reserve</a>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-brand">
          <img src={logo} className="footer-logo" alt="Martin-Bishop Field" />
          <div>
            <strong>Martin-Bishop Field</strong>
            <span>Est. 1959 &nbsp;&middot;&nbsp; Guilford, CT</span>
            <span>Guilford's outdoor event venue since 1959</span>
          </div>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <a
            href="https://maps.app.goo.gl/xKt3pTsxmiZsGXkB6"
            target="_blank"
            rel="noopener noreferrer"
          >
            111 Long Hill Rd, Guilford, CT 06437
          </a>
          <a href="tel:203-507-9645">(203) 507-9645</a>
        </div>
        <div className="footer-col">
          <h4>Navigate</h4>
          <a href="#events">About</a>
          <a href="#amenities">Amenities</a>
          <a href="#gallery">Gallery</a>
          <a href="#faq">FAQ</a>
          <a href="/reserve">Reserve the Field</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; Martin-Bishop Field Est. 1959. All rights reserved.</span>
      </div>
    </footer>
  );
}
