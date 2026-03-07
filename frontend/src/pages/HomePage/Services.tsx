import React from 'react';
import 'owl.carousel/dist/assets/owl.carousel.css';
import 'owl.carousel/dist/assets/owl.theme.default.css';
import OwlCarousel from 'react-owl-carousel';

const Services: React.FC = () => {
  const services = [
    {
      "title": "Số lượng học viên đào tạo vượt trội",
      "imgSrc": "/assets/images/service-icon-01.png",
      "description": "Trung tâm đã đào tạo hàng ngàn học viên với tỷ lệ đỗ cao, chứng minh chất lượng và uy tín vượt bậc trong ngành đào tạo lái xe.",
    },
    {
      "title": "Hệ thống xe giảng dạy hiện đại",
      "imgSrc": "/assets/images/service-icon-02.png",
      "description": "Hơn 50 xe tập lái được trang bị đầy đủ các tính năng hiện đại, đảm bảo sự an toàn và tiện nghi tối đa cho học viên.",
    },
    {
      "title": "Đội ngũ giáo viên chất lượng cao",
      "imgSrc": "/assets/images/service-icon-03.png",
      "description": "Đội ngũ giảng viên giàu kinh nghiệm và tận tâm, luôn đồng hành cùng học viên trên hành trình chinh phục bằng lái xe.",
    },
    {
      "title": "Đội ngũ kỹ thuật hỗ trợ tuyệt vời",
      "imgSrc": "/assets/images/service-icon-04.png",
      "description": "Đội ngũ kỹ thuật viên chuyên nghiệp luôn đảm bảo các phương tiện và cơ sở vật chất hoạt động tốt nhất.",
    },
    {
      "title": "Chất lượng đào tạo vượt mong đợi",
      "imgSrc": "/assets/images/service-icon-01.png",
      "description": "Cam kết mang lại chất lượng đào tạo lái xe hàng đầu, đáp ứng mọi nhu cầu học tập của học viên.",
    },
    {
      "title": "Sẵn sàng hỗ trợ mọi lúc, mọi nơi",
      "imgSrc": "/assets/images/service-icon-02.png",
      "description": "Hỗ trợ học viên 24/7 với tinh thần trách nhiệm cao, mang lại trải nghiệm học tập tốt nhất.",
    }
  ]

  const carouselOptions = {
    loop: true,
    margin: 5,
    nav: false,
    dots: true,
    autoplay: true,
    responsive: {
      0: { items: 1 },
      600: { items: 2 },
      1000: { items: 3 },
    },
  };

  return (
    <div id="services" className="our-services section">
      <div className="services-right-dec">
        <img src="/assets/images/services-right-dec.png" alt="Decoration" />
      </div>
      <div className="container">
        <div className="services-left-dec">
          <img src="/assets/images/services-left-dec.png" alt="Decoration" />
        </div>
        <div className="row">
          <div className="col-lg-6 offset-lg-3">
            <div className="section-heading">
              <h2>
                Chúng tôi <em>cung cấp</em> dịch vụ đào tạo lái xe <span>tốt nhất</span>
              </h2>
              <span>0987980417</span>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12">
            <OwlCarousel className="owl-carousel owl-services" {...carouselOptions}>
              {services.map((service, index) => (
                <div className="item" key={index}>
                  <h4>{service.title}</h4>
                  <div className="icon">
                    <img src={service.imgSrc} alt={service.title} />
                  </div>
                  <p>{service.description}</p>
                </div>
              ))}
            </OwlCarousel>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
