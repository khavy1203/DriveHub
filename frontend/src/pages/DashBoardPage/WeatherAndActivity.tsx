import React from "react";

const WeatherAndActivity: React.FC = () => {
  return (
    <div className="row">
      {/* Weather Section */}
      <div className="col-xl-8 grid-margin stretch-card">
        <div className="card card-calender">
          <div className="card-body">
            <div className="row pt-4">
              <div className="col-sm-6">
                <h1 className="text-white">10:16PM</h1>
                <h5 className="text-white">Monday 25 October, 2016</h5>
                <h5 className="text-white pt-2 m-0">Precipitation:50%</h5>
                <h5 className="text-white m-0">Humidity:23%</h5>
                <h5 className="text-white m-0">Wind:13 km/h</h5>
              </div>
              <div className="col-sm-6 text-sm-right pt-3 pt-sm-0">
                <h3 className="text-white">Clear Sky</h3>
                <p className="text-white m-0"> London, UK</p>
                <h3 className="text-white m-0">21°C</h3>
              </div>
            </div>
            <div className="row mt-5">
              <div className="col-sm-12">
                <ul className="d-flex ps-0 overflow-auto">
                  {["TODAY", "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day, index) => (
                    <li
                      key={index}
                      className={`weakly-weather-item text-white font-weight-medium text-center ${
                        day === "TODAY" ? "active" : ""
                      }`}
                    >
                      <p className="mb-0">{day}</p>
                      <i className={`mdi mdi-${index % 2 === 0 ? "weather-cloudy" : "weather-hail"}`}></i>
                      <p className="mb-0">
                        21<span className="symbol">°c</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="col-xl-4 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">
              <span className="d-flex justify-content-between">
                <span>Activity</span>
                <span className="dropdown dropleft d-block">
                  <span
                    id="dropdownMenuButton1"
                    data-bs-toggle="dropdown"
                    role="button"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="mdi mdi-dots-horizontal"></i>
                  </span>
                  <span className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                    <a className="dropdown-item" href="#">
                      Contact
                    </a>
                    <a className="dropdown-item" href="#">
                      Helpdesk
                    </a>
                    <a className="dropdown-item" href="#">
                      Chat with us
                    </a>
                  </span>
                </span>
              </span>
            </h4>
            <ul className="gradient-bullet-list border-bottom">
              <li>
                <h6 className="mb-0">It's awesome when we find a new solution</h6>
                <p className="text-muted">2h ago</p>
              </li>
              <li>
                <h6 className="mb-0">Report has been updated</h6>
                <p className="text-muted">
                  <span>2h ago</span>
                  <span className="d-inline-block">
                    <span className="d-flex d-inline-block">
                      <img className="ms-1" src="assets/images/faces/face1.jpg" alt="" />
                      <img className="ms-1" src="assets/images/faces/face10.jpg" alt="" />
                      <img className="ms-1" src="assets/images/faces/face14.jpg" alt="" />
                    </span>
                  </span>
                </p>
              </li>
              <li>
                <h6 className="mb-0">Analytics dashboard has been created#Slack</h6>
                <p className="text-muted">2h ago</p>
              </li>
              <li>
                <h6 className="mb-0">It's awesome when we find a new solution</h6>
                <p className="text-muted">2h ago</p>
              </li>
            </ul>
            <a className="text-black mt-3 mb-0 d-block h6" href="#">
              View all <i className="mdi mdi-chevron-right"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherAndActivity;
