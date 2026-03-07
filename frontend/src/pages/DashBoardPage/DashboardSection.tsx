import React from "react";

const DashboardSection: React.FC = () => {
  return (
    <div className="row">
      <div className="col-xl-3 col-lg-12 stretch-card grid-margin">
        <div className="row">
          <div className="col-xl-12 col-md-6 stretch-card grid-margin grid-margin-sm-0 pb-sm-3">
            <div className="card bg-warning">
              <div className="card-body px-3 py-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="color-card">
                    <p className="mb-0 color-card-head">Sales</p>
                    <h2 className="text-white">
                      $8,753.<span className="h5">00</span>
                    </h2>
                  </div>
                  <i className="card-icon-indicator mdi mdi-basket bg-inverse-icon-warning"></i>
                </div>
                <h6 className="text-white">18.33% Since last month</h6>
              </div>
            </div>
          </div>
          <div className="col-xl-12 col-md-6 stretch-card grid-margin grid-margin-sm-0 pb-sm-3">
            <div className="card bg-danger">
              <div className="card-body px-3 py-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="color-card">
                    <p className="mb-0 color-card-head">Margin</p>
                    <h2 className="text-white">
                      $5,300.<span className="h5">00</span>
                    </h2>
                  </div>
                  <i className="card-icon-indicator mdi mdi-cube-outline bg-inverse-icon-danger"></i>
                </div>
                <h6 className="text-white">13.21% Since last month</h6>
              </div>
            </div>
          </div>
          <div className="col-xl-12 col-md-6 stretch-card grid-margin grid-margin-sm-0 pb-sm-3 pb-lg-0 pb-xl-3">
            <div className="card bg-primary">
              <div className="card-body px-3 py-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="color-card">
                    <p className="mb-0 color-card-head">Orders</p>
                    <h2 className="text-white">
                      $1,753.<span className="h5">00</span>
                    </h2>
                  </div>
                  <i className="card-icon-indicator mdi mdi-briefcase-outline bg-inverse-icon-primary"></i>
                </div>
                <h6 className="text-white">67.98% Since last month</h6>
              </div>
            </div>
          </div>
          <div className="col-xl-12 col-md-6 stretch-card pb-sm-3 pb-lg-0">
            <div className="card bg-success">
              <div className="card-body px-3 py-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="color-card">
                    <p className="mb-0 color-card-head">Affiliate</p>
                    <h2 className="text-white">2368</h2>
                  </div>
                  <i className="card-icon-indicator mdi mdi-account-circle bg-inverse-icon-success"></i>
                </div>
                <h6 className="text-white">20.32% Since last month</h6>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xl-9 stretch-card grid-margin">
        <div className="card">
          <div className="card-body">
            <div className="row">
              <div className="col-sm-7">
                <h5>Business Survey</h5>
                <p className="text-muted">
                  Show overview jan 2018 - Dec 2019{" "}
                  <a className="text-muted font-weight-medium ps-2" href="#">
                    <u>See Details</u>
                  </a>
                </p>
              </div>
              <div className="col-sm-5 text-md-end">
                <button
                  type="button"
                  className="btn btn-icon-text mb-3 mb-sm-0 btn-inverse-primary font-weight-normal"
                >
                  <i className="mdi mdi-email btn-icon-prepend"></i>
                  Download Report
                </button>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-4">
                <div className="card mb-3 mb-sm-0">
                  <div className="card-body py-3 px-4">
                    <p className="m-0 survey-head">Today Earnings</p>
                    <div className="d-flex justify-content-between align-items-end flot-bar-wrapper">
                      <div>
                        <h3 className="m-0 survey-value">$5,300</h3>
                        <p className="text-success m-0">-310 avg. sales</p>
                      </div>
                      <div id="earningChart" className="flot-chart" style={{ padding: "0px" }}>
                        <canvas className="flot-base" width="96" height="76"></canvas>
                        <canvas className="flot-overlay" width="96" height="76"></canvas>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="card mb-3 mb-sm-0">
                  <div className="card-body py-3 px-4">
                    <p className="m-0 survey-head">Product Sold</p>
                    <div className="d-flex justify-content-between align-items-end flot-bar-wrapper">
                      <div>
                        <h3 className="m-0 survey-value">$9,100</h3>
                        <p className="text-danger m-0">-310 avg. sales</p>
                      </div>
                      <div id="productChart" className="flot-chart" style={{ padding: "0px" }}>
                        <canvas className="flot-base" width="96" height="76"></canvas>
                        <canvas className="flot-overlay" width="96" height="76"></canvas>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="card">
                  <div className="card-body py-3 px-4">
                    <p className="m-0 survey-head">Today Orders</p>
                    <div className="d-flex justify-content-between align-items-end flot-bar-wrapper">
                      <div>
                        <h3 className="m-0 survey-value">$4,354</h3>
                        <p className="text-success m-0">-310 avg. sales</p>
                      </div>
                      <div id="orderChart" className="flot-chart" style={{ padding: "0px" }}>
                        <canvas className="flot-base" width="96" height="76"></canvas>
                        <canvas className="flot-overlay" width="96" height="76"></canvas>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row my-3">
              <div className="col-sm-12">
                <div className="flot-chart-wrapper">
                  <div id="flotChart" className="flot-chart" style={{ padding: "0px" }}>
                    <canvas className="flot-base" width="1498" height="414"></canvas>
                    <canvas className="flot-overlay" width="1498" height="414"></canvas>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-8">
                <p className="text-muted mb-0">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                  incididunt ut labore et dolore. <b>Learn More</b>
                </p>
              </div>
              <div className="col-sm-4">
                <p className="mb-0 text-muted">Sales Revenue</p>
                <h5 className="d-inline-block survey-value mb-0">$2,45,500</h5>
                <p className="d-inline-block text-danger mb-0">last 8 months</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;
