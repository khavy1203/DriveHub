import React from "react";
import "owl.carousel/dist/assets/owl.carousel.css";
import "owl.carousel/dist/assets/owl.theme.default.css";
import OwlCarousel from "react-owl-carousel";

const Portfolio: React.FC = () => {
  const portfolioItems = [
    {
      "title": "Giáo viên xuất sắc",
      "img": "/assets/images/teacher/tho/1.jpg",
      "description": "Thầy Nguyễn Văn A đã đào tạo hơn 500 học viên, với 98% học viên đậu lý thuyết và 95% đậu thực hành trong lần thi đầu tiên.",
      "link": "/"
    },
    {
      "title": "Giảng viên tận tâm và chuyên nghiệp",
      "img": "/assets/images/teacher/tho/2.jpg",
      "description": "Cô Lê Thị B đã hướng dẫn 300+ học viên vượt qua kỳ thi sát hạch với tỉ lệ đỗ lý thuyết 100% và thực hành 97%.",
      "link": "/"
    },
    {
      "title": "Kinh nghiệm đào tạo vượt trội",
      "img": "/assets/images/teacher/tho/3.jpg",
      "description": "Thầy Trần Quốc C là người đã giúp hơn 400 học viên tự tin cầm lái, với 96% tỷ lệ học viên đậu kỳ thi thực hành ngay từ lần đầu tiên.",
      "link": "/"
    },
    {
      "title": "Hỗ trợ tối đa cho học viên",
      "img": "/assets/images/teacher/tho/1.jpg",
      "description": "Cô Phạm Ngọc D với 10 năm kinh nghiệm, đã giúp hơn 350 học viên đạt thành công, với tỉ lệ đậu lý thuyết và thực hành đều trên 95%.",
      "link": "/"
    },
    {
      "title": "Hỗ trợ tối đa cho học viên",
      "img": "/assets/images/teacher/tho/2.jpg",
      "description": "Cô Phạm Ngọc D với 10 năm kinh nghiệm, đã giúp hơn 350 học viên đạt thành công, với tỉ lệ đậu lý thuyết và thực hành đều trên 95%.",
      "link": "/"
    }
    ,
    {
      "title": "Hỗ trợ tối đa cho học viên",
      "img": "/assets/images/teacher/tho/3.jpg",
      "description": "Cô Phạm Ngọc D với 10 năm kinh nghiệm, đã giúp hơn 350 học viên đạt thành công, với tỉ lệ đậu lý thuyết và thực hành đều trên 95%.",
      "link": "/"
    }
  ];

  return (
    <div id="portfolio" className="our-portfolio section">
      <div className="portfolio-left-dec">
        <img src="/assets/images/portfolio-left-dec.png" alt="Decoration" />
      </div>
      <div className="container">
        <div className="row">
          <div className="col-lg-6 offset-lg-3">
            <div className="section-heading">
              <h2>
                Đội ngũ <em>giảng viên</em> & <span>thành tích nổi bật</span>
              </h2>
              <span>
                {/* content gì đó */}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-12">
            <OwlCarousel
              className="owl-carousel owl-portfolio"
              loop
              margin={30}
              nav
              dots
              items={3}
              responsive={{
                0: { items: 1 },
                600: { items: 2 },
                1000: { items: 3 },
              }}
            >
              {portfolioItems.map((item, index) => (
                <div className="item" key={index}>
                  <div className="thumb">
                    <img src={item.img} alt={item.title} />
                    <div className="hover-effect">
                      <div className="inner-content">
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            <h4>{item.title}</h4>
                          </a>
                        ) : (
                          <h4>{item.title}</h4>
                        )}
                        <span>{item.description}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </OwlCarousel>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
