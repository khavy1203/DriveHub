import React from "react";

const PurchaseHistory: React.FC = () => {
  return (
    <div className="row">
      <div className="col-xl-8 col-sm-6 grid-margin stretch-card">
        <div className="card">
          <div className="card-body px-0 overflow-auto">
            <h4 className="card-title ps-4">Purchase History</h4>
            <div className="table-responsive">
              <table className="table">
                <thead className="bg-light">
                  <tr>
                    <th>Customer</th>
                    <th>Project</th>
                    <th>Invoice</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="d-flex align-items-center">
                        <img src="assets/images/faces/face1.jpg" alt="image" />
                        <div className="table-user-name ms-3">
                          <p className="mb-0 font-weight-medium">Cecelia Cooper</p>
                          <small>Payment on hold</small>
                        </div>
                      </div>
                    </td>
                    <td>Angular Admin</td>
                    <td>
                      <div className="badge badge-inverse-success">Completed</div>
                    </td>
                    <td>$77.99</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="d-flex align-items-center">
                        <img src="assets/images/faces/face10.jpg" alt="image" />
                        <div className="table-user-name ms-3">
                          <p className="mb-0 font-weight-medium">Victor Watkins</p>
                          <small>Email verified</small>
                        </div>
                      </div>
                    </td>
                    <td>Angular Admin</td>
                    <td>
                      <div className="badge badge-inverse-success">Completed</div>
                    </td>
                    <td>$245.30</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="d-flex align-items-center">
                        <img src="assets/images/faces/face11.jpg" alt="image" />
                        <div className="table-user-name ms-3">
                          <p className="mb-0 font-weight-medium">Ada Burgess</p>
                          <small>Email verified</small>
                        </div>
                      </div>
                    </td>
                    <td>One page html</td>
                    <td>
                      <div className="badge badge-inverse-danger">Completed</div>
                    </td>
                    <td>$160.25</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="d-flex align-items-center">
                        <img src="assets/images/faces/face13.jpg" alt="image" />
                        <div className="table-user-name ms-3">
                          <p className="mb-0 font-weight-medium">Dollie Lynch</p>
                          <small>Email verified</small>
                        </div>
                      </div>
                    </td>
                    <td>Wordpress</td>
                    <td>
                      <div className="badge badge-inverse-success">Declined</div>
                    </td>
                    <td>$123.21</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="d-flex align-items-center">
                        <img src="assets/images/faces/face16.jpg" alt="image" />
                        <div className="table-user-name ms-3">
                          <p className="mb-0 font-weight-medium">Harry Holloway</p>
                          <small>Payment on process</small>
                        </div>
                      </div>
                    </td>
                    <td>VueJs Application</td>
                    <td>
                      <div className="badge badge-inverse-danger">Declined</div>
                    </td>
                    <td>$150.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <a className="text-black mt-3 d-block ps-4" href="#">
              <span className="font-weight-medium h6">View all order history</span>{" "}
              <i className="mdi mdi-chevron-right"></i>
            </a>
          </div>
        </div>
      </div>
      <div className="col-xl-4 col-sm-6 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <div className="card-title font-weight-medium">Business Survey</div>
            <p className="text-muted">
              Lorem ipsum dolor sitadipiscing elit, sed amet do eiusmod tempor we find a new
              solution
            </p>
            <div className="d-flex flex-wrap border-bottom py-2 border-top justify-content-between">
              <img className="survey-img mb-lg-3" src="assets/images/dashboard/img_3.jpg" alt="" />
              <div className="pt-2">
                <h5 className="mb-0">Villa called Archagel</h5>
                <p className="mb-0 text-muted">St, San Diego, CA</p>
                <h5 className="mb-0">$600/mo</h5>
              </div>
            </div>
            <div className="d-flex flex-wrap border-bottom py-2 justify-content-between">
              <img className="survey-img mb-lg-3" src="assets/images/dashboard/img_1.jpg" alt="" />
              <div className="pt-2">
                <h5 className="mb-0">Luxury villa in Hermo</h5>
                <p className="mb-0 text-muted">Glendale, CA</p>
                <h5 className="mb-0">$900/mo</h5>
              </div>
            </div>
            <div className="d-flex flex-wrap border-bottom py-2 justify-content-between">
              <img className="survey-img mb-lg-3" src="assets/images/dashboard/img_2.jpg" alt="" />
              <div className="pt-2">
                <h5 className="mb-0">House on the Clarita</h5>
                <p className="mb-0 text-muted">Business Survey</p>
                <h5 className="mb-0">$459/mo</h5>
              </div>
            </div>
            <a className="text-black mt-3 d-block font-weight-medium h6" href="#">
              View all <i className="mdi mdi-chevron-right"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseHistory;
