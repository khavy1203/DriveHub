import React from 'react';
import './mainpages.scss';

const platformCards = [
  { icon: 'quiz',         stat: '600+', label: 'Câu hỏi thi thử' },
  { icon: 'manage_search',stat: '24/7',  label: 'Tra cứu GPLX' },
  { icon: 'school',       stat: '95%+', label: 'Tỷ lệ đỗ thi' },
  { icon: 'people',       stat: '5K+',  label: 'Học viên Mezon' },
];

const features = [
  'Thi thử lý thuyết 600 câu, cập nhật đúng bộ đề sát hạch mới nhất',
  'Tra cứu GPLX và vi phạm giao thông nhanh chóng, chính xác',
  'Theo dõi lịch học, nhắc nhở và hỗ trợ trực tiếp từ giảng viên',
  'Cộng đồng học viên sôi động trên nền tảng chat Mezon',
];

const MezonSection: React.FC = () => {
  return (
    <section className="hp-platform">
      <div className="hp-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="hp-platform-inner">
          {/* Content */}
          <div className="hp-platform-content hp-reveal">
            <div className="hp-section-label">
              <i className="material-icons">chat_bubble</i>
              Nền tảng Mezon
            </div>
            <h2 className="hp-section-title">
              Học lái xe thông minh trên <em>Mezon</em>
            </h2>
            <p className="hp-section-sub">
              Mezon là nền tảng chat & cộng đồng được DriveHub tích hợp để mang đến trải nghiệm học lái xe hoàn toàn mới – tiện lợi, hiệu quả và kết nối.
            </p>

            <ul className="hp-platform-list">
              {features.map((f, i) => (
                <li key={i}>
                  <i className="material-icons">check_circle</i>
                  {f}
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="/#/teststudent" className="hp-btn hp-btn--primary">
                <i className="material-icons">quiz</i>
                Thi thử ngay
              </a>
              <a href="/#/lookup" className="hp-btn hp-btn--white">
                <i className="material-icons">search</i>
                Tra cứu GPLX
              </a>
            </div>
          </div>

          {/* Visual cards */}
          <div className="hp-platform-visual hp-reveal delay-2">
            {platformCards.map((card, i) => (
              <div className="hp-platform-card" key={i}>
                <i className={`material-icons pc-icon`}>{card.icon}</i>
                <strong>{card.stat}</strong>
                <span>{card.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MezonSection;
