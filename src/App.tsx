import './App.css';
import { Header, Footer } from './components/Navbars/Navbars';
import { FaqsSection } from './components/Faqs/Faqs';
import { Hero } from './components/Hero/Hero';
import { GallerySection } from './components/Gallery/Gallery';
import { ReserveSection } from './components/Reserve/Reserve';
import { DetailsSection } from './components/Details/Details';
import { EventsSection } from './components/Events/Events';
import { AmenitiesSection } from './components/Amenities/Amenities';

function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header />
      <main id="main-content">
        <Hero />

        <EventsSection />

        <AmenitiesSection />

        <ReserveSection />

        <DetailsSection />

        <GallerySection />

        <FaqsSection />

        <section className="section section-cta">
          <div className="container">
            <h2>Ready to Book Your Event?</h2>
            <p>
              Check availability and reserve Martin-Bishop Field for your next gathering in Guilford, CT.
            </p>
            <div className="cta-actions">
              <a href="/reserve" className="btn-primary btn-large">Reserve the Field</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default App;
