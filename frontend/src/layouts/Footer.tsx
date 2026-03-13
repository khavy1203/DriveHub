/**
 * Footer component
 * @module layouts/Footer
 */

import React from 'react';
import './Footer.scss';

export const Footer: React.FC = () => {
  return (
    <footer>
      <div className="container">
        <div className="row">
          <div className="col-lg-3">
            <div className="about footer-item">
              <div className="logo">
                <a href="#">
                  <img src="assets/images/logo.png" alt="Trung Tâm Đào Tạo Lái Xe" />
                </a>
              </div>
              <p>Email liên hệ:</p>
              <a href="mailto:khavy1203@gmail.com">khavy1203@gmail.com</a>
              <ul>
                <li>
                  <a href="https://www.facebook.com/nhoke.bola/" title="Facebook">
                    <i className="fa fa-facebook"></i>
                  </a>
                </li>
                <li>
                  <a href="#" title="Twitter">
                    <i className="fa fa-twitter"></i>
                  </a>
                </li>
                <li>
                  <a href="#" title="Instagram">
                    <i className="fa fa-instagram"></i>
                  </a>
                </li>
                <li>
                  <a href="#" title="Behance">
                    <i className="fa fa-behance"></i>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="services footer-item">
              <h4>Dịch Vụ</h4>
              <ul>
                <li><a href="#">Đào Tạo Lái Xe Hạng B2</a></li>
                <li><a href="#">Đào Tạo Lái Xe Hạng C</a></li>
                <li><a href="#">Học Lý Thuyết Lái Xe Online</a></li>
                <li><a href="#">Hỗ Trợ Ôn Thi Sát Hạch</a></li>
              </ul>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="community footer-item">
              <h4>Cộng Đồng</h4>
              <ul>
                <li><a href="#">Câu Hỏi Thường Gặp</a></li>
                <li><a href="#">Học Lái Xe Hiệu Quả</a></li>
                <li><a href="#">Cẩm Nang Lái Xe An Toàn</a></li>
                <li><a href="#">Tin Tức Giao Thông</a></li>
              </ul>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="subscribe-newsletters footer-item">
              <h4>Đăng Ký Nhận Tin</h4>
              <p>Nhận các thông tin và chương trình ưu đãi mới nhất qua email.</p>
              <form action="#" method="get">
                <input
                  type="text"
                  name="email"
                  id="email"
                  pattern="[^ @]*@[^ @]*"
                  placeholder="Nhập Email của bạn"
                  required
                />
                <button type="submit" id="form-submit" className="main-button">
                  <i className="fa fa-paper-plane-o"></i>
                </button>
              </form>
            </div>
          </div>
          <div className="col-lg-12">
            <div className="copyright">
              <p>
                Bản quyền © 2024 Trung Tâm Đào Tạo Lái Xe. Mọi quyền được bảo lưu.
                <br />
                Thiết kế bởi <a rel="nofollow" href="https://www.facebook.com/nhoke.bola/">Khả Vy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
