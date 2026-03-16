import logo from '/logo.svg'
import './Navbars.css';

export function Header() {
  return (
    <header>
        <a href="/">
          <img src={logo} className="logo" alt="Martin-Bishop Field Logo" />
        </a>
        <div className="title">
          <h2>Martin-Bishop Memorial Field</h2>
          <h5>Guilford, CT</h5>
        </div>
        <nav>
          <a href="/reserve">Reserve the field</a>
          <a href="/faqs">FAQs</a>
          <a href="/history">History</a>
        </nav>
    </header>
  )
}

export function Footer() {
  return (
    <footer>
        <a href="https://maps.app.goo.gl/xKt3pTsxmiZsGXkB6">111 Long Hill Rd Guilford, CT 06437</a>
        <a href="tel:203-507-9645">(203) 507-9645</a>
    </footer>
  )
}