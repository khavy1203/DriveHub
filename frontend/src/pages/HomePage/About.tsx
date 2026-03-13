import React from 'react';
import "./mainpages.scss";
const About: React.FC = () => {
  const achievements = [
    {
      "icon": "/assets/images/service-icon-01.png",
      "count": 5000,
      "title": "Học viên đã được đào tạo",
      "description": "Cơ sở đã đào tạo hơn 5000 học viên với tỷ lệ đậu kỳ thi lái xe vượt trội, đạt trên 95%."
    },
    {
      "icon": "/assets/images/service-icon-02.png",
      "count": 300,
      "title": "Số lượng xe tập lái",
      "description": "Hệ thống xe tập lái hiện đại với hơn 300 chiếc, đảm bảo an toàn và trải nghiệm tốt nhất cho học viên."
    },
    {
      "icon": "/assets/images/service-icon-03.png",
      "count": 50,
      "title": "Giáo viên giàu kinh nghiệm",
      "description": "Đội ngũ giáo viên chuyên nghiệp, tận tâm với hơn 10 năm kinh nghiệm đào tạo lái xe."
    },
  ]


  return (
    <div id="about" className="about-us section">
      <div className="container">
        <div className="row">
          <div className="col-lg-6 align-self-center">
            <div className="left-image">
              <img
                // src="/assets/images/about-left-image.png"
                src="/assets/images/4296c82e-0628-4304-9e7a-f56a971d7794.webp"
                alt="Two Girls working together"
              />
            </div>
          </div>
          <div className="col-lg-6">
            <div className="section-heading">
              <h2>
                Thành tựu <em>đào tạo lái xe</em> &amp; <span>chuyên nghiệp</span>
              </h2>
              <p>
                Trung tâm chúng tôi tự hào đã đào tạo thành công hơn 5,000 học viên với tỷ lệ đỗ kỳ thi lái xe đạt trên 95%.
                Chúng tôi không ngừng nâng cao chất lượng giảng dạy, cung cấp các khóa học từ cơ bản đến nâng cao, đảm bảo
                mọi học viên đều tự tin và an toàn trên mọi cung đường.
              </p>

              <div className="row">
                {achievements.map((achievement, index) => (
                  <div className="col-lg-4" key={index}>
                    <div className="fact-item">
                      <div className="count-area-content">
                        <div className="icon">
                          <img src={achievement.icon} alt={achievement.title} />
                        </div>
                        <div className="count-digit">{achievement.count}</div>
                        <div className="count-title">{achievement.title}</div>
                        <p>{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
