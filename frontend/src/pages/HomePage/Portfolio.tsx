import React from "react";
import "owl.carousel/dist/assets/owl.carousel.css";
import "owl.carousel/dist/assets/owl.theme.default.css";
import OwlCarousel from "react-owl-carousel";

interface Teacher {
  name: string;
  role: string;
  img: string;
  description: string;
  students: number;
  successRate: number;
}

const Portfolio: React.FC = () => {
  const teachers: Teacher[] = [
    {
      name: "Thầy Nguyễn Văn An",
      role: "Giảng viên bằng B2",
      img: "/assets/images/teacher/tho/1.jpg",
      description: "Hơn 12 năm kinh nghiệm, đào tạo 500+ học viên với tỉ lệ đỗ lý thuyết 98% và thực hành 95% ngay lần đầu.",
      students: 500,
      successRate: 98,
    },
    {
      name: "Cô Lê Thị Bích",
      role: "Giảng viên bằng A1",
      img: "/assets/images/teacher/tho/2.jpg",
      description: "Phong cách giảng dạy tận tâm, hướng dẫn 300+ học viên qua sát hạch với tỉ lệ đỗ lý thuyết 100% và thực hành 97%.",
      students: 300,
      successRate: 100,
    },
    {
      name: "Thầy Trần Quốc Cường",
      role: "Giảng viên bằng C",
      img: "/assets/images/teacher/tho/3.jpg",
      description: "Giúp 400+ học viên tự tin cầm lái, tỷ lệ đậu thực hành lần đầu đạt 96% – uy tín hàng đầu tại trung tâm.",
      students: 400,
      successRate: 96,
    },
    {
      name: "Cô Phạm Ngọc Dung",
      role: "Giảng viên bằng B1",
      img: "/assets/images/teacher/tho/1.jpg",
      description: "10 năm kinh nghiệm, đồng hành cùng 350+ học viên, tỉ lệ đỗ lý thuyết và thực hành đều vượt 95%.",
      students: 350,
      successRate: 95,
    },
    {
      name: "Thầy Hoàng Minh Đức",
      role: "Giảng viên bằng B2",
      img: "/assets/images/teacher/tho/2.jpg",
      description: "Phương pháp giảng dạy thực tế, sát đề thi, đã hỗ trợ 280+ học viên đạt chứng chỉ lái xe an toàn.",
      students: 280,
      successRate: 97,
    },
    {
      name: "Cô Vũ Thị Oanh",
      role: "Giảng viên bằng A2",
      img: "/assets/images/teacher/tho/3.jpg",
      description: "Nổi tiếng với lớp học ôn tập hiệu quả, giúp 320+ học viên tự tin vượt qua kỳ thi sát hạch lái xe.",
      students: 320,
      successRate: 99,
    },
  ];

  return (
    <div id="portfolio" className="our-portfolio section">
      <div className="portfolio-left-dec">
        <img src="/assets/images/portfolio-left-dec.png" alt="" />
      </div>

      <div className="container">
        <div className="row">
          <div className="col-lg-6 offset-lg-3">
            <div className="section-heading">
              <h2>
                Đội ngũ <em>giảng viên</em> &amp; <span>thành tích nổi bật</span>
              </h2>
              <p className="pf-section-sub">Những giảng viên tâm huyết, giàu kinh nghiệm – đồng hành cùng bạn trên con đường chinh phục bằng lái xe.</p>
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
              margin={24}
              nav={false}
              dots
              responsive={{
                0:    { items: 1 },
                600:  { items: 2 },
                1000: { items: 3 },
              }}
            >
              {teachers.map((teacher, index) => (
                <div className="pf-card" key={index}>
                  {/* Image */}
                  <div className="pf-card-img-wrap">
                    <img className="pf-card-img" src={teacher.img} alt={teacher.name} />
                    <div className="pf-card-img-overlay"></div>
                    <span className="pf-card-role-badge">{teacher.role}</span>
                  </div>

                  {/* Body */}
                  <div className="pf-card-body">
                    <div className="pf-card-avatar">
                      <img src={teacher.img} alt={teacher.name} />
                    </div>
                    <h4 className="pf-card-name">{teacher.name}</h4>
                    <p className="pf-card-desc">{teacher.description}</p>
                    <div className="pf-card-stats">
                      <div className="pf-stat">
                        <strong>{teacher.successRate}%</strong>
                        <span>Tỷ lệ đỗ</span>
                      </div>
                      <div className="pf-divider-v"></div>
                      <div className="pf-stat">
                        <strong>{teacher.students}+</strong>
                        <span>Học viên</span>
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
