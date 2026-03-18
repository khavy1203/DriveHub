import React, { useState, useEffect } from 'react';
import './mainpages.scss';

const slides = [
  {
    badge: 'Nền tảng Mezon',
    title: 'Chinh phục bằng lái xe cùng ',
    highlight: 'DriveHub',
    desc: 'Trung tâm đào tạo lái xe Trung Bộ – nơi hơn 5,000 học viên đã thành công. Học lý thuyết, thi thử và tra cứu GPLX ngay trên Mezon.',
    cta1: { text: 'Đăng ký ngay', href: '#contact', icon: 'arrow_forward' },
    cta2: { text: 'Xem khóa học', href: '#services', icon: 'play_circle' },
  },
  {
    badge: 'Tỷ lệ đỗ 95%+',
    title: 'Học lái xe chuyên nghiệp tại ',
    highlight: 'Bình Định',
    desc: 'Đội ngũ 50+ giảng viên giàu kinh nghiệm, 300+ xe tập lái hiện đại. Đảm bảo chất lượng đào tạo vượt trội, an toàn và uy tín nhất khu vực.',
    cta1: { text: 'Liên hệ ngay', href: '#contact', icon: 'phone' },
    cta2: { text: 'Tìm hiểu thêm', href: '#services', icon: 'info' },
  },
  {
    badge: 'Thi thử trực tuyến',
    title: 'Luyện thi lý thuyết miễn phí trên ',
    highlight: 'Mezon',
    desc: 'Tra cứu GPLX, thi thử 600 câu hỏi sát hạch, xem vi phạm phạt nguội – tất cả trong một nền tảng duy nhất, hoàn toàn miễn phí.',
    cta1: { text: 'Thi thử ngay', href: '/#/teststudent', icon: 'quiz' },
    cta2: { text: 'Tra cứu GPLX', href: '/#/license-check', icon: 'search' },
  },
];

const HeroVisual: React.FC = () => (
  <div className="hv-card">
    {/* Header */}
    <div className="hv-header">
      <div className="hv-header-left">
        <div className="hv-logo-dot" />
        <span className="hv-logo-text">DriveHub</span>
      </div>
      <div className="hv-rating">
        <i className="material-icons">star</i>
        <span>4.9</span>
      </div>
    </div>

    {/* Speedometer visual */}
    <div className="hv-gauge-wrap">
      <div className="hv-gauge">
        <div className="hv-gauge-ring hv-gauge-ring--outer" />
        <div className="hv-gauge-ring hv-gauge-ring--inner" />
        <div className="hv-gauge-center">
          <i className="material-icons hv-car-icon">directions_car</i>
          <span className="hv-gauge-label">Sẵn sàng</span>
        </div>
      </div>
      {/* Floating badge */}
      <div className="hv-badge-pass">
        <i className="material-icons">verified</i>
        <div>
          <strong>95%+</strong>
          <span>Tỷ lệ đỗ</span>
        </div>
      </div>
    </div>

    {/* License classes */}
    <div className="hv-classes">
      {['B2', 'B11', 'C', 'FC'].map((cls) => (
        <div className="hv-class-chip" key={cls}>
          <span className="hv-class-label">Hạng</span>
          <strong>{cls}</strong>
        </div>
      ))}
    </div>

    {/* Feature row */}
    <div className="hv-features-row">
      <div className="hv-feat">
        <i className="material-icons">quiz</i>
        <span>Thi thử</span>
      </div>
      <div className="hv-feat">
        <i className="material-icons">people</i>
        <span>50+ GV</span>
      </div>
      <div className="hv-feat">
        <i className="material-icons">school</i>
        <span>5,000+ HV</span>
      </div>
      <div className="hv-feat">
        <i className="material-icons">search</i>
        <span>Tra cứu</span>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="hv-bottom">
      <div className="hv-progress-label">
        <span>Tỷ lệ hoàn thành khóa học</span>
        <strong>96%</strong>
      </div>
      <div className="hv-progress-bar">
        <div className="hv-progress-fill" />
      </div>
    </div>
  </div>
);

const Mainbanner: React.FC = () => {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive(a => (a + 1) % slides.length);
      setAnimKey(k => k + 1);
    }, 5500);
    return () => clearInterval(id);
  }, []);

  const goTo = (i: number) => {
    setActive(i);
    setAnimKey(k => k + 1);
  };

  const slide = slides[active];

  return (
    <section className="hp-hero" id="top">
      <div className="hp-hero-bg">
        <div className="hp-hero-bg-dots" />
        <div className="hp-hero-bg-circle hp-hero-bg-circle--1" />
        <div className="hp-hero-bg-circle hp-hero-bg-circle--2" />
        <div className="hp-hero-bg-circle hp-hero-bg-circle--3" />
      </div>

      <div className="hp-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="hp-hero-inner">
          {/* Content */}
          <div className="hp-hero-content" key={animKey}>
            <div className="hp-hero-badge">
              <i className="material-icons">verified</i>
              {slide.badge}
            </div>

            <h1 className="hp-hero-title">
              {slide.title}<span>{slide.highlight}</span>
            </h1>

            <p className="hp-hero-desc">{slide.desc}</p>

            <div className="hp-hero-cta">
              <a href={slide.cta1.href} className="hp-btn hp-btn--primary">
                <i className="material-icons">{slide.cta1.icon}</i>
                {slide.cta1.text}
              </a>
              <a href={slide.cta2.href} className="hp-btn hp-btn--outline">
                <i className="material-icons">{slide.cta2.icon}</i>
                {slide.cta2.text}
              </a>
            </div>

            <div className="hp-hero-mezon">
              <span className="hp-hero-mezon-text">Tích hợp trên</span>
              <a
                href="https://mezon.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hp-hero-mezon-badge"
              >
                <i className="material-icons">chat_bubble</i>
                Mezon Platform
              </a>
            </div>

            <div className="hp-hero-slides">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`hp-hero-dot${i === active ? ' active' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="hp-hero-visual">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mainbanner;
