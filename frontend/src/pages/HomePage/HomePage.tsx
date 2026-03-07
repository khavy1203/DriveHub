// Trang chủ bao gồm toàn bộ các phần nội dung
import React from 'react';

// Import các thành phần trang
import Mainbanner from './Mainbanner';
import About from './About';
import Contact from './Contact';
import Services from './Services';
import Portfolio from './Portfolio';
import Pricing from './Pricing';
import Subscribe from './Subscribe';
import VideoSection from './VideoSection';
import FooterDesc from './FooterDesc';

// Trang chủ hiển thị toàn bộ nội dung
const HomePage: React.FC = () => {
  return (
    <>
      <Mainbanner />
      <Services />
      <Portfolio />
      <About />
      <Pricing />
      {/* <Subscribe /> */}
      {/* <VideoSection /> */}
      <Contact />
      <FooterDesc />
    </>
  );
};

export default HomePage;
