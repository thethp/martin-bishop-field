import './App.css';
import { Header, Footer } from './components/Navbars';
import Carousel from './components/Carousel';

function App() {
  const images = ['https://martin-bishopfield.com/wp-content/uploads/2016/10/pa160506.jpeg', 'https://martin-bishopfield.com/wp-content/uploads/2021/05/6dbc31b9-4353-4884-bf10-3e6e552659ef.jpeg'];

  return (
    <>
      <Header />
      <main>
        <Carousel images={images} />
        <h4>This family friendly outdoor event venue in Guilford, Connecticut is the perfect for weddings, family reunions, and gatherings of all kinds.</h4>
        <button className="secondary">Reserve the field!</button>
      </main>
      <Footer />
    </>
  )
}

export default App
