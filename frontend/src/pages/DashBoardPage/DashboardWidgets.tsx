import React from "react";

const DashboardWidgets: React.FC = () => {
  return (
    <div className="row">
      {/* Pending Invoices */}
      <div className="col-xl-4 col-md-6 grid-margin stretch-card">
        <div className="card card-invoice">
          <div className="card-body">
            <h4 className="card-title pb-3">Pending invoices</h4>
            {[
              {
                date: "06 Jan 2019",
                name: "Isabel Cross",
                image: "assets/images/faces/face2.jpg",
                colorClass: "bg-info",
              },
              {
                date: "18 Mar 2019",
                name: "Carrie Parker",
                image: "assets/images/faces/face3.jpg",
                colorClass: "bg-primary",
              },
              {
                date: "10 Apr 2019",
                name: "Don Bennett",
                image: "assets/images/faces/face11.jpg",
                colorClass: "bg-warning",
              },
              {
                date: "18 Mar 2019",
                name: "Carrie Parker",
                image: "assets/images/faces/face3.jpg",
                colorClass: "bg-info",
              },
            ].map((invoice, index) => (
              <div className="list-card" key={index}>
                <div className="row align-items-center">
                  <div className="col-7 col-sm-8">
                    <div className="row align-items-center">
                      <div className="col-sm-4">
                        <img src={invoice.image} alt="" />
                      </div>
                      <div className="col-sm-8 pe-0 pl-sm-0">
                        <span>{invoice.date}</span>
                        <h6 className="mb-1 mb-sm-0">{invoice.name}</h6>
                      </div>
                    </div>
                  </div>
                  <div className="col-5 col-sm-4">
                    <div className="d-flex pt-1 align-items-center">
                      <div className={`reload-outer ${invoice.colorClass}`}>
                        <i className="mdi mdi-reload"></i>
                      </div>
                      <div className="dropdown dropleft ps-1 pt-3">
                        <div
                          id={`dropdownMenuButton${index}`}
                          data-bs-toggle="dropdown"
                          role="button"
                          aria-haspopup="true"
                          aria-expanded="false"
                        >
                          <p>
                            <i className="mdi mdi-dots-vertical"></i>
                          </p>
                        </div>
                        <div
                          className="dropdown-menu"
                          aria-labelledby={`dropdownMenuButton${index}`}
                        >
                          <a className="dropdown-item" href="#">
                            Sales
                          </a>
                          <a className="dropdown-item" href="#">
                            Track Invoice
                          </a>
                          <a className="dropdown-item" href="#">
                            Payment History
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Datepicker */}
      <div className="col-xl-4 col-md-6 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <div id="inline-datepicker" className="datepicker">
              <div className="datepicker datepicker-inline">
                <div className="datepicker-days">
                  <table className="table-condensed">
                    <thead>
                      <tr>
                        <th className="prev">
                          <i className="mdi mdi-chevron-left"></i>
                        </th>
                        <th colSpan={5} className="datepicker-switch">
                          December 2024
                        </th>
                        <th className="next">
                          <i className="mdi mdi-chevron-right"></i>
                        </th>
                      </tr>
                      <tr>
                        <th className="dow">Su</th>
                        <th className="dow">Mo</th>
                        <th className="dow">Tu</th>
                        <th className="dow">We</th>
                        <th className="dow">Th</th>
                        <th className="dow">Fr</th>
                        <th className="dow">Sa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Add date rows dynamically or statically here */}
                      <tr>
                        <td className="day">1</td>
                        <td className="day">2</td>
                        <td className="day">3</td>
                        <td className="day">4</td>
                        <td className="day">5</td>
                        <td className="day">6</td>
                        <td className="day">7</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Browser Stats */}
      <div className="col-xl-4 col-md-6 stretch-card grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">Browser stats</h4>
            {[
              { name: "opera mini", usage: "23%", logo: "opera-logo.png" },
              { name: "Safari", usage: "07%", logo: "safari-logo.png" },
              { name: "Chrome", usage: "33%", logo: "chrome-logo.png" },
              { name: "Firefox", usage: "17%", logo: "firefox-logo.png" },
              { name: "Explorer", usage: "05%", logo: "explorer-logo.png" },
            ].map((browser, index) => (
              <div className="row py-2" key={index}>
                <div className="col-sm-12">
                  <div className="d-flex justify-content-between pb-3 border-bottom">
                    <div>
                      <img
                        className="me-2"
                        src={`assets/images/browser-logo/${browser.logo}`}
                        alt=""
                      />
                      <span className="p">{browser.name}</span>
                    </div>
                    <p className="mb-0">{browser.usage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardWidgets;
