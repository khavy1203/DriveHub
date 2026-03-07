import React from "react";

const ProBanner: React.FC = () => {
    return (
        <div className="row p-0 m-0 proBanner d-flex" id="proBanner">
            <div className="col-md-12 p-0 m-0">
                <div className="card-body card-body-padding d-flex align-items-center justify-content-between">
                    <div className="ps-lg-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <p className="mb-0 font-weight-medium me-3 buy-now-text">
                                Khả Vy dev
                            </p>
                            <a
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn me-2 buy-now-btn border-0"
                            >
                                Link Home Page
                            </a>
                        </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                        <a href="/">
                            <i className="mdi mdi-home me-3 text-white"></i>
                        </a>Khả Vy
                        <button id="bannerClose" className="btn border-0 p-0">
                            <i className="mdi mdi-close text-white"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProBanner;
