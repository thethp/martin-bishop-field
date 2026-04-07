import { Routes, Route } from 'react-router-dom';
import './App.css';
import { Header, Footer } from './components/Navbars/Navbars';
import { FaqsSection } from './components/Faqs/Faqs';
import { Hero } from './components/Hero/Hero';
import { GallerySection } from './components/Gallery/Gallery';
import { ReserveSection } from './components/Reserve/Reserve';
import { DetailsSection } from './components/Details/Details';
import { EventsSection } from './components/Events/Events';
import { AmenitiesSection } from './components/Amenities/Amenities';
import { CTASection } from './components/CTA/CTA';
import { AdminPage } from './pages/AdminPage/AdminPage';

function HomePage() {
  return (
    <>
      <Hero />
      <EventsSection />
      <AmenitiesSection />
      <ReserveSection />
      <DetailsSection />
      <GallerySection />
      <FaqsSection />
      <CTASection />
    </>
  );
}

function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
