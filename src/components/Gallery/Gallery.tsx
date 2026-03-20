import { useEffect, useState, useRef } from 'react';
import './Gallery.css';

const GALLERY_IMAGES = [
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160517.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160516.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160515.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160512.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160507.jpeg',
  'https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160506.jpeg',
];

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
      <button ref={closeRef} className="btn-glass modal-close" onClick={onClose} aria-label="Close photo viewer">&times;</button>
      <button className="btn-glass modal-arrow left"  onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous photo">&#8249;</button>
      <img
        className="modal-img"
        src={images[idx]}
        alt={`Martin-Bishop Field event photo ${idx + 1} of ${images.length}`}
        onClick={e => e.stopPropagation()}
      />
      <button className="btn-glass modal-arrow right" onClick={e => { e.stopPropagation(); next(); }} aria-label="Next photo">&#8250;</button>
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

export function GallerySection() {
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
      {modalIndex !== null && <GalleryModal images={GALLERY_IMAGES} index={modalIndex} onClose={closeModal} />}
    </section>
  );
}
