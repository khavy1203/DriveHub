// Trang chủ bao gồm toàn bộ các phần nội dung
import React from 'react';

import Mainbanner from './Mainbanner';
import About from './About';
import Contact from './Contact';
import Services from './Services';
import Portfolio from './Portfolio';
import Pricing from './Pricing';
import Subscribe from './Subscribe';
import VideoSection from './VideoSection';
import FooterDesc from './FooterDesc';

const HomePage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <>
      {/* Navbar chỉ hiện trên mobile, ẩn hoàn toàn trên desktop */}
      <div className="tc-mobile-navbar">
        <div className="tc-mobile-navbar-content container">
          <a href="/" className="tc-mobile-logo">
            <img src="/assets/images/logo.png" alt="Logo" />
          </a>
          <i
            className="material-icons tc-menu-icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? 'close' : 'menu'}
          </i>
        </div>

        {isMenuOpen && (
          <div className="tc-mobile-dropdown">
            <div className="container">
              <a href="/" onClick={() => setIsMenuOpen(false)}>Trang chủ</a>
              <a href="/#/teststudent" onClick={() => setIsMenuOpen(false)}>Thi Thử 5 Môn</a>
              <a href="/#/traffic-check" onClick={() => setIsMenuOpen(false)}>Kiểm Tra Phạt Nguội</a>
              <a href="/#/dashboard" onClick={() => setIsMenuOpen(false)}>DashBoard</a>
              <a href="/#/qr-scanner" onClick={() => setIsMenuOpen(false)}>QR Scanner</a>
            </div>
          </div>
        )}
      </div>

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