import React from 'react';
import { getContactTelHref, isMobileDevice } from './contactUtils';
import './mainpages.scss';

const plans = [
  {
    name: 'Hạng B2',
    icon: 'directions_car',
    iconClass: '--1',
    original: '21,000,000 VND',
    price: '19,000,000',
    features: [
      'Bao gồm tập thiết bị',
      'Học lý thuyết online',
      'Học cabin thực hành',
      'Dạy lý thuyết miễn phí',
    ],
    featured: false,
  },
  {
    name: 'Hạng B11',
    icon: 'directions_bus',
    iconClass: '--2',
    original: '21,000,000 VND',
    price: '19,000,000',
    features: [
      'Bao gồm tập thiết bị',
      'Học lý thuyết online',
      'Học cabin thực hành',
      'Dạy lý thuyết miễn phí',
    ],
    featured: true,
  },
  {
    name: 'Hạng C1',
    icon: 'local_shipping',
    iconClass: '--3',
    original: '23,000,000 VND',
    price: '21,000,000',
    features: [
      'Bao gồm tập thiết bị',
      'Học lý thuyết online',
      'Học cabin thực hành',
      'Dạy lý thuyết miễn phí',
    ],
    featured: false,
  },
  {
    name: 'Hạng CE',
    icon: 'airport_shuttle',
    iconClass: '--4',
    original: '19,000,000 VND',
    price: '17,000,000',
    features: [
      'Bao gồm tập thiết bị',
      'Học lý thuyết online',
      'Học cabin thực hành',
      'Dạy lý thuyết miễn phí',
    ],
    featured: false,
  },
];

const Pricing: React.FC = () => {
  const telHref = getContactTelHref();

  return (
    <section id="pricing" className="hp-pricing hp-section">
      <div className="hp-container">
        <div className="hp-pricing-header hp-reveal">
          <div className="hp-section-label">
            <i className="material-icons">payments</i>
            Học phí
          </div>
          <h2 className="hp-section-title">
            Chi tiết học phí theo <em>hạng bằng</em>
          </h2>
          <p className="hp-section-sub">
            Học phí trọn gói – cam kết không phụ thu. Bao gồm toàn bộ chi phí đào tạo và thi sát hạch.
          </p>
        </div>

        <div className="hp-pricing-grid">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`hp-pricing-card${plan.featured ? ' hp-pricing-card--featured' : ''} hp-reveal delay-${i + 1}`}
            >
              {plan.featured && (
                <span className="hp-pricing-popular">Phổ biến nhất</span>
              )}

              <i className={`material-icons hp-pricing-icon hp-pricing-icon${plan.iconClass}`}>
                {plan.icon}
              </i>

              <div className="hp-pricing-name">{plan.name}</div>
              <div className="hp-pricing-original">{plan.original}</div>
              <div className="hp-pricing-price">
                {plan.price} <span>VND</span>
              </div>

              <ul className="hp-pricing-features">
                {plan.features.map((f, fi) => (
                  <li className="hp-pricing-feature" key={fi}>
                    <i className="material-icons">check_circle</i>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={isMobileDevice() ? telHref : '#contact'}
                className={`hp-btn${plan.featured ? ' hp-btn--primary' : ' hp-btn--dark'}`}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <i className="material-icons">phone</i>
                Liên hệ ngay
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
