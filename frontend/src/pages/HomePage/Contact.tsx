import React, { useState } from 'react';
import { toast } from 'react-toastify';
import httpClient from '../../shared/services/httpClient';
import { getContactPhoneDisplayLabel, getContactTelHref } from './contactUtils';
import './mainpages.scss';

/** Embed + share link for application submission location (resolved from Google Maps short URL). */
const APPLICATION_MAP_EMBED_SRC =
  'https://www.google.com/maps?q=13.999262%2C109.0677072&z=17&hl=vi&output=embed';
const APPLICATION_MAP_DIRECTIONS_URL = 'https://maps.app.goo.gl/DGV6Sn3ioU4rciWw8';

type SubmitState = 'idle' | 'submitting';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const telHref = getContactTelHref();
  const phoneLabel = getContactPhoneDisplayLabel();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (submitState === 'submitting') return;
    setSubmitState('submitting');
    try {
      const { data } = await httpClient.post<{ EC: number; EM: string }>('/api/public/contact-lead', {
        name: name.trim(),
        phone: phone.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
      });
      if (data.EC === 0) {
        toast.success(data.EM);
        setName('');
        setPhone('');
        setEmail('');
      } else {
        toast.warning(data.EM);
      }
    } catch {
      // httpClient interceptor already toasts errors for failures
    } finally {
      setSubmitState('idle');
    }
  };

  return (
    <section id="contact" className="hp-contact hp-section">
      <div className="hp-container">
        <div className="hp-contact-inner">
          {/* Info & Map */}
          <div className="hp-contact-info hp-reveal">
            <div className="hp-section-label">
              <i className="material-icons">location_on</i>
              Liên hệ
            </div>
            <h2 className="hp-section-title">
              Đăng ký tư vấn <em>miễn phí</em>
            </h2>
            <p className="hp-section-sub">
              Để lại thông tin và chúng tôi sẽ liên hệ tư vấn khóa học phù hợp nhất cho bạn trong thời gian sớm nhất.
            </p>

            <div className="hp-contact-map-wrap">
              <p className="hp-contact-map-caption">Điểm tiếp nhận / nộp hồ sơ</p>
              <div className="hp-contact-map">
                <iframe
                  src={APPLICATION_MAP_EMBED_SRC}
                  title="Bản đồ điểm nộp hồ sơ"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                className="hp-contact-directions"
                href={APPLICATION_MAP_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="material-icons" aria-hidden="true">
                  directions
                </i>
                Chỉ đường trên Google Maps
              </a>
            </div>

            <div className="hp-contact-details">
              <a href={telHref} className="hp-contact-item">
                <i className="material-icons">phone</i>
                {phoneLabel}
              </a>
              <a href="mailto:khavy1203@gmail.com" className="hp-contact-item">
                <i className="material-icons">email</i>
                khavy1203@gmail.com
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="hp-contact-form-card hp-reveal delay-2">
            <div className="hp-contact-form-title">Gửi thông tin đăng ký</div>
            <p className="hp-contact-form-sub">
              Trên máy tính: điền họ tên và số điện thoại, nhấn gửi — chúng tôi nhận email ngay. Trên điện thoại bạn có thể gọi trực tiếp qua số bên trái.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="hp-form-group">
                <label className="hp-form-label" htmlFor="hp-name">Họ và tên</label>
                <input
                  id="hp-name"
                  className="hp-form-input"
                  type="text"
                  name="name"
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                />
              </div>
              <div className="hp-form-group">
                <label className="hp-form-label" htmlFor="hp-phone">Số điện thoại</label>
                <input
                  id="hp-phone"
                  className="hp-form-input"
                  type="tel"
                  name="phone"
                  placeholder="0987 xxx xxx"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(ev) => setPhone(ev.target.value)}
                />
              </div>
              <div className="hp-form-group">
                <label className="hp-form-label" htmlFor="hp-email">Email (không bắt buộc)</label>
                <input
                  id="hp-email"
                  className="hp-form-input"
                  type="email"
                  name="email"
                  placeholder="email@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                />
              </div>
              <button type="submit" className="hp-form-submit" disabled={submitState === 'submitting'}>
                <i className="material-icons">send</i>
                {submitState === 'submitting' ? 'Đang gửi…' : 'Gửi thông tin'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
