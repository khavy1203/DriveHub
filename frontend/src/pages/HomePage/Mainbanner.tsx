import React from "react";
import OwlCarousel from "react-owl-carousel"; // Thư viện hỗ trợ carousel
import "owl.carousel/dist/assets/owl.carousel.css"; // CSS của OwlCarousel
import "owl.carousel/dist/assets/owl.theme.default.css";
import "./mainpages.css"; // CSS của riêng bạn

const Mainbanner: React.FC = () => {
  const carouselItems = [
    {
      "title": "Chào bạn đến với Trung tâm Đào tạo Lái xe Trung Bộ",
      "headline": "Bạn đang tìm nơi học lái xe chuyên nghiệp và đáng tin cậy tại Bình Định?",
      "description": "Hãy đến với Trung tâm Đào tạo Lái xe Trung Bộ, nơi mang đến chất lượng đào tạo vượt trội, đội ngũ giảng viên tận tâm và môi trường học tập an toàn, hiện đại. Cùng chúng tôi chinh phục bằng lái xe mơ ước chỉ trong thời gian ngắn!",
      "buttonText": "Liên hệ ngay",
      "buttonLink": "#contact",
      "phone": "0987980417"
    },
    {
      "title": "Dịch vụ đào tạo 1st Bình Định",
      "headline": "Trải nghiệm học lái xe chất lượng cao!",
      "description": "Tại Trung Bộ, chúng tôi tự hào là trung tâm đào tạo lái xe uy tín, nơi mọi học viên đều được hỗ trợ tận tình và học với các phương tiện hiện đại nhất. Hãy để chúng tôi giúp bạn tự tin trên mọi cung đường!",
      "buttonText": "Tìm hiểu thêm",
      "buttonLink": "#services",
      "phone": "0987980417"
    },
    {
      "title": "Chinh phục giấc mơ lái xe",
      "headline": "Tham gia ngay các khóa học video hướng dẫn thực tế",
      "description": "Khám phá các video hướng dẫn lái xe thực tế, dễ hiểu và gần gũi của chúng tôi. Chỉ cần ngồi nhà, bạn đã có thể nắm bắt các kiến thức quan trọng để trở thành tài xế tự tin!",
      "buttonText": "Xem ngay",
      "buttonLink": "#video",
      "phone": "0987980417"
    }
  ]


  return (
    <div className="main-banner" id="top">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="row">
              <div className="col-lg-6 align-self-center">
                <OwlCarousel
                  className="owl-theme"
                  loop
                  margin={10}
                  nav
                  items={1}
                  autoplay
                  autoplayTimeout={5000}
                  autoplayHoverPause
                >
                  {carouselItems.map((item, index) => (
                    <div key={index} className="item header-text">
                      <h6>{item.title}</h6>
                      <h2>
                        {item.headline.split(" ").map((word, idx) => (
                          <React.Fragment key={idx}>
                            {word.startsWith("<em>") ? (
                              <em>{word.replace("<em>", "").replace("</em>", "")}</em>
                            ) : word.startsWith("<span>") ? (
                              <span>{word.replace("<span>", "").replace("</span>", "")}</span>
                            ) : (
                              word
                            )}{" "}
                          </React.Fragment>
                        ))}
                      </h2>
                      <p>{item.description}</p>
                      <div className="down-buttons">
                        <div className="main-blue-button-hover">
                          <a href={item.buttonLink}>{item.buttonText}</a>
                        </div>
                        <div className="call-button">
                          <a href="#">
                            <i className="fa fa-phone"></i> {item.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </OwlCarousel>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mainbanner;
