import React from 'react';

const Subscribe: React.FC = () => {
  return (
    <div id="subscribe" className="subscribe">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="inner-content">
              <div className="row">
                <div className="col-lg-10 offset-lg-1">
                  <h2>Know Your Website SEO Score by Email</h2>
                  <form id="subscribe" action="" method="get">
                    <input
                      type="text"
                      name="website"
                      id="website"
                      placeholder="Your Website URL"
                      required
                    />
                    <input
                      type="text"
                      name="email"
                      id="email"
                      pattern="[^ @]*@[^ @]*"
                      placeholder="Your Email"
                      required
                    />
                    <button type="submit" id="form-submit" className="main-button">
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
