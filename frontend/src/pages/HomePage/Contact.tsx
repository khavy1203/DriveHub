import React from 'react';

const Contact: React.FC = () => {
  return (
    <div id="contact" className="contact-us section">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="section-heading">
              <h2>Chúng tôi sẽ liên hệ bạn qua <em>Form</em></h2>
            </div>
          </div>
        </div>
        <div className="row contact-main-row">
          <div className="col-lg-7">
            <div id="map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d61942.22526329651!2d109.01821118185508!3d13.994928913211206!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x316f3a5fc9342e71%3A0xa38c56f130e30a93!2zQ8ahIHPhu58gMyAtIFRyxrDhu51uZyBDYW8gxJHhurNuZyBDxqEgxJFp4buHbiAtIFjDonkgZOG7sW5nIHbDoCBOw7RuZyBMw6JtIFRydW5nIGLhu5ku!5e0!3m2!1svi!2s!4v1735008160460!5m2!1svi!2s"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Map"
              ></iframe>
            </div>
            <div className="info">
              <span>
                <i className="fa fa-phone"></i>{' '}
                <a href="tel:0987980417">0987980417</a>
              </span>
              <span>
                <i className="fa fa-envelope"></i>{' '}
                <a href="mailto:khavy1203@gmail.com">khavy1203@gmail.com</a>
              </span>
            </div>
          </div>
          <div className="col-lg-5 align-self-center">
            <form id="contact" action="" method="get">
              <div className="row">
                <div className="col-lg-12">
                  <fieldset>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      placeholder="Họ và Tên"
                      autoComplete="on"
                      required
                    />
                  </fieldset>
                </div>
                <div className="col-lg-12">
                  <fieldset>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      placeholder="Số điện thoại"
                      autoComplete="on"
                      required
                    />
                  </fieldset>
                </div>
                <div className="col-lg-12">
                  <fieldset>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      placeholder="Email"
                      pattern="[^ @]*@[^ @]*"
                      required
                    />
                  </fieldset>
                </div>
                <div className="col-lg-12">
                  <fieldset>
                    <button type="submit" id="form-submit" className="main-button">
                      Gửi Thông Tin
                    </button>
                  </fieldset>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="contact-dec">
        <img src="assets/images/contact-dec.png" alt="Decoration" />
      </div>
      <div className="contact-left-dec">
        <img src="assets/images/contact-left-dec.png" alt="Decoration" />
      </div>
    </div>
  );
};

export default Contact;
