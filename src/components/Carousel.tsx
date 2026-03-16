import { useState } from 'react';
import './Carousel.css';

interface CarouselProps {
  images: Array<string>
}

const Carousel = ({ images }: CarouselProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const shiftCarousel = (direction: number) => {
    if (currentImageIndex + direction < 0) {
      setCurrentImageIndex(images.length - 1);
    } else if (currentImageIndex + direction > (images.length-1)) {
      setCurrentImageIndex(0);
    } else {
      setCurrentImageIndex(currentImageIndex + direction);
    }
  };

  if (images.length === 1) {
    return <img className='carousel' src={images[0]} />
  } else {
    return (
      <div className="carousel" style={{backgroundImage: `url(${images[currentImageIndex]})`}}>
        <div className='left control' onClick={() => shiftCarousel(-1)} />
        <div className='right control' onClick={() => shiftCarousel(1)} />
      </div>
    )
  }
}

export default Carousel;