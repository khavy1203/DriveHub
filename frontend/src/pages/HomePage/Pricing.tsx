import React from "react";

const Pricing: React.FC = () => {
  const plans = [
    {
      "name": "Hạng B2",
      "originalPrice": "20,000,000 VND",
      "discountedPrice": "17,000,000 VND",
      "features": [
        "Bao gồm cả tập thiết bị",
        "Học lý thuyết online",
        "Học cabin",
        "Kèm dạy lý thuyết miễn phí"
      ],
      "buttonText": "Liên hệ",
      "buttonLink": "#contact",
      "itemClass": "first-item"
    },
    {
      "name": "Hạng B11",
      "originalPrice": "20,000,000 VND",
      "discountedPrice": "17,000,000 VND",
      "features": [
        "Bao gồm cả tập thiết bị",
        "Học lý thuyết online",
        "Học cabin",
        "Kèm dạy lý thuyết miễn phí"
      ],
      "buttonText": "Liên hệ",
      "buttonLink": "#contact",
      "itemClass": "second-item"
    },
    {
      "name": "Hạng C",
      "originalPrice": "24,000,000 VND",
      "discountedPrice": "21,000,000 VND",
      "features": [
        "Bao gồm cả tập thiết bị",
        "Học lý thuyết online",
        "Học cabin",
        "Kèm dạy lý thuyết miễn phí"
      ],
      "buttonText": "Liên hệ",
      "buttonLink": "#contact",
      "itemClass": "third-item"
    },
    {
      "name": "Hạng FC",
      "originalPrice": "25,000,000 VND",
      "discountedPrice": "20,000,000 VND",
      "features": [
        "Bao gồm cả tập thiết bị",
        "Học lý thuyết online",
        "Học cabin",
        "Kèm dạy lý thuyết miễn phí"
      ],
      "buttonText": "Liên hệ",
      "buttonLink": "#contact",
      "itemClass": "fourth-item"
    }
  ]

  return (
    <div id="pricing" className="pricing-tables">
      <div className="tables-left-dec">
        <img src="assets/images/tables-left-dec.png" alt="" />
      </div>
      <div className="tables-right-dec">
        <img src="assets/images/tables-right-dec.png" alt="" />
      </div>
      <div className="container">
        <div className="row">
          <div className="col-lg-6 offset-lg-3">
            <div className="section-heading">
              <h2>
                CHI TIẾT <em>HỌC PHÍ</em> THEO <span>HẠNG BẰNG</span>
              </h2>
              <span>Học phí trọn gói - Cam kết không phụ thu</span>
            </div>
          </div>
        </div>
        <div className="row">
          {plans.map((plan, index) => (
            <div className="col-lg-3" key={index}>
              <div className={`item ${plan.itemClass}`}>
                <h4>{plan.name}</h4>
                <em>{plan.originalPrice}</em>
                <span>{plan.discountedPrice}</span>
                <ul>
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex}>{feature}</li>
                  ))}
                </ul>
                <div className="main-blue-button-hover">
                  <a href={plan.buttonLink}>{plan.buttonText}</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
