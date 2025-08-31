import './index.css';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ImageFragmenter from './pages/ImageFragmenter';
import Footer from './components/Footer';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<ImageFragmenter/>} />
    </Routes>
    <Footer/>
  </BrowserRouter>
);