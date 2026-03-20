import './Events.css'

function EventCard({title, description}: {title: string, description: string}) {
  return (
    <div className="event-card">
      <div className="event-card-bar"></div>
      <h3>{title}</h3>
      <p>
        {description}
      </p>
    </div>
  );
}

export function EventsSection() {
  return (
    <section id="events" className="section section-white">
      <div className="container">
        <h2>The Perfect Setting for Every Occasion</h2>
        <p className="section-sub">
          Nestled along Connecticut's shoreline, Martin-Bishop Field — also known as Fireman's Field — has been
          Guilford's most beloved outdoor gathering place since 1959. Spacious, flexible, and full of character.
        </p>
        <div className="card-grid">
          <EventCard 
            title='Weddings'
            description='Say "I do" in the open air. Our beautiful grounds provide an ideal backdrop for outdoor ceremonies, al fresco receptions, and everything in between.'
          />
          <EventCard 
            title='Family Reunions'
            description='Bring everyone together. With sports facilities, wide open green space, and full on-site amenities, there`s room for every generation to enjoy the day.'
          />
          <EventCard 
            title='Parties & Gatherings'
            description='Birthdays, graduations, community events — whatever the occasion, our versatile venue accommodates parties of all sizes and styles.'
          />
        </div>
      </div>
    </section>
  );
}