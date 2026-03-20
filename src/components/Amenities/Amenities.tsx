import './Amenities.css';

const AMENITIES = [
  'Softball Backstop',
  'Basketball Hoop',
  'Volleyball Net',
  'Badminton Rackets',
  'Horseshoe Pits',
  'Restrooms',
  'Refrigerators',
  'Trash Dumpsters',
];

export function AmenitiesSection() {
  return (
    <section id="amenities" className="section section-amenities">
      <div className="container">
        <h2>What's On-Site</h2>
        <p className="section-sub">Everything you need for a great event, already here.</p>
        <div className="amenity-grid">
          {AMENITIES.map((label) => (
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
  );
}