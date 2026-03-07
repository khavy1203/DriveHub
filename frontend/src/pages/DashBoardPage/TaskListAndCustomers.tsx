import React from "react";

const TaskListAndCustomers = () => {
  return (
    <div className="row">
      <div className="col-xl-4 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title text-black">To do Task List</h4>
            <p className="text-muted">Created by anonymous</p>
            <div className="list-wrapper">
              <ul className="d-flex flex-column-reverse todo-list todo-list-custom">
                <li>
                  <div className="form-check">
                    <label className="form-check-label">
                      <input className="checkbox" type="checkbox" /> Meeting with Alisa{" "}
                      <i className="input-helper"></i>
                    </label>
                    <span className="list-time">4 Hours Ago</span>
                  </div>
                </li>
                <li>
                  <div className="form-check">
                    <label className="form-check-label">
                      <input className="checkbox" type="checkbox" /> Create invoice{" "}
                      <i className="input-helper"></i>
                    </label>
                    <span className="list-time">6 Hours Ago</span>
                  </div>
                </li>
                <li className="completed">
                  <div className="form-check">
                    <label className="form-check-label">
                      <input className="checkbox" type="checkbox" defaultChecked /> Prepare for
                      presentation <i className="input-helper"></i>
                    </label>
                    <span className="list-time">2 Hours Ago</span>
                  </div>
                </li>
                <li>
                  <div className="form-check">
                    <label className="form-check-label">
                      <input className="checkbox" type="checkbox" /> Pick up kids from school{" "}
                      <i className="input-helper"></i>
                    </label>
                    <span className="list-time">8 Hours Ago</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="add-items d-flex flex-wrap flex-sm-nowrap">
              <input
                type="text"
                className="form-control todo-list-input flex-grow"
                placeholder="Add task name"
              />
              <button className="add btn btn-primary font-weight-regular text-nowrap" id="add-task">
                Add Task
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xl-4 col-md-6 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title text-black">Recent Customers</h4>
            <p className="text-muted">All contacts</p>
            <div className="row pt-2 pb-1">
              <div className="col-12 col-sm-7">
                <div className="row">
                  <div className="col-4 col-md-4">
                    <img className="customer-img" src="assets/images/faces/face22.jpg" alt="" />
                  </div>
                  <div className="col-8 col-md-8 p-sm-0">
                    <h6 className="mb-0">Cecelia Cooper</h6>
                    <p className="text-muted font-12">05:58AM</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-5 ps-0">
                <canvas
                  id="areaChart1"
                  width="226"
                  height="112"
                  style={{ display: "block", height: "75px", width: "151px" }}
                  className="chartjs-render-monitor"
                ></canvas>
              </div>
            </div>
            <div className="row py-1">
              <div className="col-sm-7">
                <div className="row">
                  <div className="col-4 col-sm-4">
                    <img className="customer-img" src="assets/images/faces/face25.jpg" alt="" />
                  </div>
                  <div className="col-8 col-sm-8 p-sm-0">
                    <h6 className="mb-0">Victor Watkins</h6>
                    <p className="text-muted font-12">05:28AM</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-5 ps-0">
                <canvas
                  id="areaChart2"
                  width="226"
                  height="112"
                  style={{ display: "block", height: "75px", width: "151px" }}
                  className="chartjs-render-monitor"
                ></canvas>
              </div>
            </div>
            <div className="row py-1">
              <div className="col-sm-7">
                <div className="row">
                  <div className="col-4 col-sm-4">
                    <img className="customer-img" src="assets/images/faces/face15.jpg" alt="" />
                  </div>
                  <div className="col-8 col-sm-8 p-sm-0">
                    <h6 className="mb-0">Ada Burgess</h6>
                    <p className="text-muted font-12">05:57AM</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-5 ps-0">
                <canvas
                  id="areaChart3"
                  width="226"
                  height="112"
                  style={{ display: "block", height: "75px", width: "151px" }}
                  className="chartjs-render-monitor"
                ></canvas>
              </div>
            </div>
            <div className="row py-1">
              <div className="col-sm-7">
                <div className="row">
                  <div className="col-4 col-sm-4">
                    <img className="customer-img" src="assets/images/faces/face5.jpg" alt="" />
                  </div>
                  <div className="col-8 col-sm-8 p-sm-0">
                    <h6 className="mb-0">Dollie Lynch</h6>
                    <p className="text-muted font-12">05:59AM</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-5 ps-0">
                <canvas
                  id="areaChart4"
                  width="226"
                  height="112"
                  style={{ display: "block", height: "75px", width: "151px" }}
                  className="chartjs-render-monitor"
                ></canvas>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-7">
                <div className="row">
                  <div className="col-4 col-sm-4">
                    <img className="customer-img" src="assets/images/faces/face2.jpg" alt="" />
                  </div>
                  <div className="col-8 col-sm-8 p-sm-0">
                    <h6 className="mb-0">Harry Holloway</h6>
                    <p className="text-muted font-12 mb-0">05:13AM</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-5 ps-0">
                <canvas
                  id="areaChart5"
                  height="75"
                  width="226"
                  style={{ display: "block", height: "50px", width: "151px" }}
                  className="chartjs-render-monitor"
                ></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xl-4 col-md-6 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title text-black">Business Survey</h4>
            <p className="text-muted pb-2">Jan 01 2019 - Dec 31 2019</p>
            <canvas
              id="surveyBar"
              width="553"
              height="276"
              style={{ display: "block", height: "184px", width: "369px" }}
              className="chartjs-render-monitor"
            ></canvas>
            <div className="row border-bottom pb-3 pt-4 align-items-center mx-0">
              <div className="col-sm-9 ps-0">
                <div className="d-flex">
                  <img src="assets/images/dashboard/img_4.jpg" alt="" />
                  <div className="ps-2">
                    <h6 className="m-0">Red Chair</h6>
                    <p className="m-0">Home Decoration</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-3 ps-0 pl-sm-3">
                <div className="badge badge-inverse-success mt-3 mt-sm-0"> +7.7%</div>
              </div>
            </div>
            <div className="row py-3 align-items-center mx-0">
              <div className="col-sm-9 ps-0">
                <div className="d-flex">
                  <img src="assets/images/dashboard/img_5.jpg" alt="" />
                  <div className="ps-2">
                    <h6 className="m-0">Gray Sofa</h6>
                    <p className="m-0">Home Decoration</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-3 ps-0 pl-sm-3">
                <div className="badge badge-inverse-success mt-3 mt-sm-0"> +7.7%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskListAndCustomers;
