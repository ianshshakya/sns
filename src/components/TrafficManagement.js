import React, { useEffect, useState } from "react";

export default function TrafficDashboard() {
  const [trafficData, setTrafficData] = useState({
    north_south: 0,
    east_west: 0,
    total: 0,
    current_direction: "NORTH_SOUTH",
    light_state: "GREEN",
  });

  // Fetch traffic data periodically
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://sns-backend2.onrender.com/data");
        const data = await response.json();
        setTrafficData(data);
      } catch (error) {
        console.error("Error fetching traffic data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Light color mapping
  const lightColors = {
    GREEN: "#4ade80",
    YELLOW: "#fde047",
    RED: "#f87171",
  };

  return (
    <div className="min-vh-100 bg-dark text-light d-flex flex-column overflow-hidden">
      {/* Header */}
      <header className="py-2 bg-black">
        <div className="container-fluid">
          <h1 className="text-center h5 fw-bold text-warning mb-0">
            <i className="bi bi-traffic-light me-1"></i>
            Smart Traffic Control
          </h1>
        </div>
      </header>

      <div className="container-fluid flex-grow-1 d-flex flex-column overflow-hidden p-2">
        <div className="row flex-grow-1 g-2 overflow-hidden">
          {/* Video Feed Section */}
          <div className="col-12 col-lg-8 d-flex flex-column overflow-hidden">
            <div className="card bg-dark border-secondary h-100 d-flex flex-column">
              <div className="card-header bg-black border-secondary py-1">
                <h3 className="card-title mb-0 text-warning small">
                  <i className="bi bi-camera-video me-1"></i>Live Traffic Feed
                </h3>
              </div>
              <div className="card-body p-0 position-relative flex-grow-1 d-flex">
                <img
                  src="https://sns-backend2.onrender.com/video"
                  alt="Traffic Feed"
                  className="img-fluid w-100 h-100"
                  style={{ objectFit: "cover" }}
                />
                <div className="position-absolute bottom-0 start-0 p-1 bg-dark bg-opacity-75 w-100">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-light small">Live</span>
                    <div className="d-flex align-items-center">
                      <span className="text-danger me-1" style={{fontSize: "8px"}}>●</span>
                      <span className="small">Recording</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Light Status */}
          <div className="col-12 col-lg-4 d-flex flex-column overflow-hidden">
            <div className="card bg-dark border-secondary h-100 d-flex flex-column">
              <div className="card-header bg-black border-secondary py-1">
                <h3 className="card-title mb-0 text-warning small">
                  <i className="bi bi-traffic-light me-1"></i>Signal Status
                </h3>
              </div>
              <div className="card-body text-center p-2 d-flex flex-column justify-content-center">
                <div className="traffic-light-housing bg-secondary rounded p-1 mx-auto mb-2" style={{ width: "80px" }}>
                  <div 
                    className="traffic-light-bulb rounded-circle mx-auto mb-1"
                    style={{ 
                      width: "45px", 
                      height: "45px", 
                      backgroundColor: trafficData.light_state === "RED" ? lightColors.RED : "#542626",
                      boxShadow: trafficData.light_state === "RED" ? `0 0 8px ${lightColors.RED}` : "none",
                      transition: "all 0.3s ease"
                    }}
                  ></div>
                  <div 
                    className="traffic-light-bulb rounded-circle mx-auto mb-1"
                    style={{ 
                      width: "45px", 
                      height: "45px", 
                      backgroundColor: trafficData.light_state === "YELLOW" ? lightColors.YELLOW : "#4d4d26",
                      boxShadow: trafficData.light_state === "YELLOW" ? `0 0 8px ${lightColors.YELLOW}` : "none",
                      transition: "all 0.3s ease"
                    }}
                  ></div>
                  <div 
                    className="traffic-light-bulb rounded-circle mx-auto"
                    style={{ 
                      width: "45px", 
                      height: "45px", 
                      backgroundColor: trafficData.light_state === "GREEN" ? lightColors.GREEN : "#264426",
                      boxShadow: trafficData.light_state === "GREEN" ? `0 0 8px ${lightColors.GREEN}` : "none",
                      transition: "all 0.3s ease"
                    }}
                  ></div>
                </div>
                <h6 className="mt-1 text-uppercase fw-bold mb-0" style={{ color: lightColors[trafficData.light_state] }}>
                  {trafficData.light_state}
                </h6>
                <p className="mb-0 small mt-1">Direction: {trafficData.current_direction.replace("_", "-")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Data Cards */}
        <div className="row mt-2 g-2">
          <div className="col-12 col-sm-4">
            <div className="card bg-black border-info h-100">
              <div className="card-body text-center p-2">
                <i className="bi bi-signpost-split text-info mb-1 d-block" style={{fontSize: "1.2rem"}}></i>
                <h6 className="card-title text-info mb-1">North-South</h6>
                <h4 className="fw-bold text-light mb-0" style={{fontSize: "1.5rem"}}>{trafficData.north_south}</h4>
                <small className="text-muted">Vehicles</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-4">
            <div className="card bg-black border-warning h-100">
              <div className="card-body text-center p-2">
                <i className="bi bi-signpost-split text-warning mb-1 d-block" style={{fontSize: "1.2rem"}}></i>
                <h6 className="card-title text-warning mb-1">East-West</h6>
                <h4 className="fw-bold text-light mb-0" style={{fontSize: "1.5rem"}}>{trafficData.east_west}</h4>
                <small className="text-muted">Vehicles</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-4">
            <div className="card bg-black border-success h-100">
              <div className="card-body text-center p-2">
                <i className="bi bi-bar-chart text-success mb-1 d-block" style={{fontSize: "1.2rem"}}></i>
                <h6 className="card-title text-success mb-1">Total Traffic</h6>
                <h4 className="fw-bold text-light mb-0" style={{fontSize: "1.5rem"}}>{trafficData.total}</h4>
                <small className="text-muted">All vehicles</small>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="row mt-2">
          <div className="col-12">
            <div className="card bg-dark border-secondary">
              <div className="card-header bg-black border-secondary py-1">
                <h3 className="card-title mb-0 text-warning small">
                  <i className="bi bi-info-circle me-1"></i>System Status
                </h3>
              </div>
              <div className="card-body p-2">
                <div className="row g-1">
                  <div className="col-6 col-md-6">
                    <div className="d-flex align-items-center mb-1">
                      <div className="bg-success rounded-circle me-1" style={{ width: "8px", height: "8px" }}></div>
                      <div>
                        <small className="text-light">Camera System</small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="bg-success rounded-circle me-1" style={{ width: "8px", height: "8px" }}></div>
                      <div>
                        <small className="text-light">Traffic Sensors</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-6">
                    <div className="d-flex align-items-center mb-1">
                      <div className="bg-success rounded-circle me-1" style={{ width: "8px", height: "8px" }}></div>
                      <div>
                        <small className="text-light">Signal Control</small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="bg-success rounded-circle me-1" style={{ width: "8px", height: "8px" }}></div>
                      <div>
                        <small className="text-light">Data Analysis</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-1 bg-black mt-auto">
        <div className="container-fluid">
          <p className="mb-0 text-center text-muted small">
            &copy; {new Date().getFullYear()} Smart Traffic Control System
          </p>
        </div>
      </footer>

      {/* Custom CSS */}
      <style>
        {`
          body, html, #root {
            height: 100%;
            overflow: hidden;
          }
          
          .min-vh-100 {
            min-height: 100vh;
          }
          
          .card {
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          }
          
          .traffic-light-housing {
            position: relative;
            border: 4px solid #333;
          }
          
          .traffic-light-housing::before {
            content: '';
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            width: 16px;
            height: 16px;
            background-color: #444;
            border-radius: 2px;
          }
          
          .traffic-light-housing::after {
            content: '';
            position: absolute;
            bottom: -24px;
            left: 50%;
            transform: translateX(-50%);
            width: 12px;
            height: 24px;
            background-color: #555;
            border-radius: 2px 2px 0 0;
          }
          
          /* Responsive adjustments */
          @media (max-width: 576px) {
            .traffic-light-housing {
              width: 70px !important;
            }
            
            .traffic-light-bulb {
              width: 35px !important;
              height: 35px !important;
            }
            
            h4 {
              font-size: 1.3rem !important;
            }
          }
        `}
      </style>
    </div>
  );
}