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
      <header className="py-3 bg-black">
        <div className="container-fluid">
          <h1 className="text-center h4 fw-bold text-warning mb-0">
            <i className="bi bi-traffic-light me-2"></i>
            Smart Traffic Control
          </h1>
        </div>
      </header>

      <div className="container-fluid flex-grow-1 d-flex flex-column overflow-hidden py-2">
        <div className="row flex-grow-1 overflow-hidden">
          {/* Video Feed Section */}
          <div className="col-lg-8 mb-3 d-flex flex-column overflow-hidden">
            <div className="card bg-dark border-secondary h-100 d-flex flex-column">
              <div className="card-header bg-black border-secondary py-2">
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
                    <div className="d-flex">
                      <span className="text-danger me-1">●</span>
                      <span className="small">Recording</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Light Status */}
          <div className="col-lg-4 mb-3 d-flex flex-column overflow-hidden">
            <div className="card bg-dark border-secondary h-100 d-flex flex-column">
              <div className="card-header bg-black border-secondary py-2">
                <h3 className="card-title mb-0 text-warning small">
                  <i className="bi bi-traffic-light me-1"></i>Signal Status
                </h3>
              </div>
              <div className="card-body text-center py-2 d-flex flex-column justify-content-center">
                <div className="traffic-light-housing bg-secondary rounded p-2 mx-auto mb-2" style={{ width: "100px" }}>
                  <div 
                    className={`traight-light-bulb rounded-circle mx-auto mb-1 ${trafficData.light_state === "RED" ? "active" : ""}`}
                    style={{ 
                      width: "60px", 
                      height: "60px", 
                      backgroundColor: trafficData.light_state === "RED" ? lightColors.RED : "#542626",
                      boxShadow: trafficData.light_state === "RED" ? `0 0 10px ${lightColors.RED}` : "none",
                      transition: "all 0.3s ease"
                    }}
                  ></div>
                  <div 
                    className={`traight-light-bulb rounded-circle mx-auto mb-1 ${trafficData.light_state === "YELLOW" ? "active" : ""}`}
                    style={{ 
                      width: "60px", 
                      height: "60px", 
                      backgroundColor: trafficData.light_state === "YELLOW" ? lightColors.YELLOW : "#4d4d26",
                      boxShadow: trafficData.light_state === "YELLOW" ? `0 0 10px ${lightColors.YELLOW}` : "none",
                      transition: "all 0.3s ease"
                    }}
                  ></div>
                  <div 
                    className={`traight-light-bulb rounded-circle mx-auto ${trafficData.light_state === "GREEN" ? "active" : ""}`}
                    style={{ 
                      width: "60px", 
                      height: "60px", 
                      backgroundColor: trafficData.light_state === "GREEN" ? lightColors.GREEN : "#264426",
                      boxShadow: trafficData.light_state === "GREEN" ? `0 0 10px ${lightColors.GREEN}` : "none",
                      transition: "all 0.3s ease"
                    }}
                  ></div>
                </div>
                <h5 className="mt-2 text-uppercase fw-bold mb-1" style={{ color: lightColors[trafficData.light_state] }}>
                  {trafficData.light_state}
                </h5>
                <p className="mb-0 small">Direction: {trafficData.current_direction.replace("_", "-")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Data Cards */}
        <div className="row mt-2 g-2 overflow-hidden flex-nowrap">
          <div className="col-4">
            <div className="card bg-black border-info h-100">
              <div className="card-body text-center p-2">
                <i className="bi bi-signpost-split text-info h5 mb-1"></i>
                <h6 className="card-title text-info mb-1">North-South</h6>
                <h4 className="fw-bold text-light mb-0">{trafficData.north_south}</h4>
                <small className="text-muted">Vehicles</small>
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="card bg-black border-warning h-100">
              <div className="card-body text-center p-2">
                <i className="bi bi-signpost-split text-warning h5 mb-1"></i>
                <h6 className="card-title text-warning mb-1">East-West</h6>
                <h4 className="fw-bold text-light mb-0">{trafficData.east_west}</h4>
                <small className="text-muted">Vehicles</small>
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="card bg-black border-success h-100">
              <div className="card-body text-center p-2">
                <i className="bi bi-bar-chart text-success h5 mb-1"></i>
                <h6 className="card-title text-success mb-1">Total Traffic</h6>
                <h4 className="fw-bold text-light mb-0">{trafficData.total}</h4>
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
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <div className="bg-success rounded-circle me-2" style={{ width: "10px", height: "10px" }}></div>
                      <div>
                        <small className="mb-0 text-light">Camera System</small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="bg-success rounded-circle me-2" style={{ width: "10px", height: "10px" }}></div>
                      <div>
                        <small className="mb-0 text-light">Traffic Sensors</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <div className="bg-success rounded-circle me-2" style={{ width: "10px", height: "10px" }}></div>
                      <div>
                        <small className="mb-0 text-light">Signal Control</small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="bg-success rounded-circle me-2" style={{ width: "10px", height: "10px" }}></div>
                      <div>
                        <small className="mb-0 text-light">Data Analysis</small>
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
      <footer className="py-2 bg-black">
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
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          }
          
          .traffic-light-housing {
            position: relative;
            border: 5px solid #333;
          }
          
          .traffic-light-housing::before {
            content: '';
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 20px;
            background-color: #444;
            border-radius: 3px;
          }
          
          .traffic-light-housing::after {
            content: '';
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            width: 15px;
            height: 30px;
            background-color: #555;
            border-radius: 3px 3px 0 0;
          }
        `}
      </style>
    </div>
  );
}