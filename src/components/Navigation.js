import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const colors = ["#ff0000", "#0000ff", "#00ff00", "#ff9900", "#9900ff"]; // Different colors for routes

const Navigation = () => {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState([]);
  const [startCoords, setStartCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchRoutes = async () => {
    if (!destination) {
      alert("Please enter destination!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("https://sns-backend1-1.onrender.com/get_routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start, destination }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setRoutes(data.routes || []);
      setStartCoords(data.start_coords);
      setDestCoords(data.dest_coords);
    } catch (err) {
      console.error("Error fetching routes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="d-flex vh-100 vw-100 overflow-hidden">
      {/* Sidebar Toggle Button (Mobile) */}
      <button 
        className="btn btn-dark d-lg-none position-fixed"
        onClick={toggleSidebar}
        style={{
          zIndex: 1000,
          top: "10px",
          left: "10px",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <i className={`fa-solid ${isSidebarOpen ? "fa-xmark" : "fa-bars"}`}></i>
      </button>

      {/* Sidebar */}
      <div 
        className={`d-flex flex-column bg-light ${isSidebarOpen ? 'd-flex' : 'd-none'} d-lg-flex`}
        style={{ 
          width: "100%", 
          maxWidth: "350px",
          zIndex: 999,
          boxShadow: "2px 0 10px rgba(0,0,0,0.1)"
        }}
      >
        <div className="d-flex flex-column p-3 h-100">
          {/* Header */}
          <div className="text-center mb-4 mt-3">
            <h2 className="fw-bold" style={{fontFamily: '"Gill Sans Extrabold", sans-serif', color: "#2c3e50", fontSize: "1.5rem"}}>
              Start A Journey
            </h2>
          </div>

          {/* Input Section */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="start" className="form-label fw-semibold">Start Location</label>
                <input
                  id="start"
                  type="text"
                  placeholder="Enter Start (optional)"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="form-control"
                />
                <div className="form-text">Leave empty to use current location</div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="destination" className="form-label fw-semibold">Destination *</label>
                <input
                  id="destination"
                  type="text"
                  placeholder="Enter Destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
              
              <button
                onClick={fetchRoutes}
                disabled={isLoading || !destination}
                className="btn btn-dark w-100 py-2"
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Finding Routes...
                  </>
                ) : (
                  "Get Routes"
                )}
              </button>
            </div>
          </div>

          {/* Routes List */}
          <div className="flex-grow-1 overflow-auto">
            <h4 className="mb-3">Available Routes</h4>
            
            {routes.length === 0 ? (
              <div className="text-center text-muted py-4">
                <i className="fa-solid fa-route fa-2x mb-2 d-block"></i>
                <p>No routes yet. Enter destination above.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {routes.map((r, i) => (
                  <div 
                    key={i} 
                    className="card route-card"
                    style={{borderLeft: `4px solid ${colors[i % colors.length]}`}}
                  >
                    <div className="card-body py-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="card-title mb-1" style={{fontSize: "0.9rem"}}>
                          <span className="badge bg-secondary me-2">{i + 1}</span>
                          {r.summary}
                        </h6>
                        <span className="badge rounded-pill" style={{backgroundColor: colors[i % colors.length], fontSize: "0.7rem"}}>
                          {r.distance}
                        </span>
                      </div>
                      <p className="card-text mb-0 small text-muted">
                        <i className="fa-regular fa-clock me-1"></i>
                        {r.duration || r.duration_in_traffic}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="flex-grow-1 position-relative">
        <MapContainer
          center={[28.6139, 77.209]} // Default Delhi
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Start Marker */}
          {startCoords && (
            <Marker position={startCoords}>
              <Popup>
                <strong>Start:</strong> {start || "Current Location"}
              </Popup>
            </Marker>
          )}

          {/* Destination Marker */}
          {destCoords && (
            <Marker position={destCoords}>
              <Popup>
                <strong>Destination:</strong> {destination}
              </Popup>
            </Marker>
          )}

          {/* Routes */}
          {routes.map((r, i) => {
            let coords = r.coords || [];
            if (r.polyline) {
              // Decode Google polyline
              const polyline = require("@mapbox/polyline");
              coords = polyline.decode(r.polyline).map(coord => [coord[0], coord[1]]);
            }
            return (
              <Polyline
                key={i}
                positions={coords}
                pathOptions={{ 
                  color: colors[i % colors.length], 
                  weight: 6, 
                  opacity: 0.8,
                  lineJoin: 'round'
                }}
              />
            );
          })}
        </MapContainer>
        
        {/* Map Controls Info */}
        <div className="position-absolute bottom-0 end-0 m-3 bg-white p-2 rounded shadow-sm small d-none d-md-block">
          <div className="d-flex align-items-center">
            <i className="fa-solid fa-circle-info text-primary me-1"></i>
            <span>Use ctrl + scroll to zoom map</span>
          </div>
        </div>
        
        {/* Overlay when sidebar is open on mobile */}
        {isSidebarOpen && window.innerWidth < 992 && (
          <div 
            className="position-absolute w-100 h-100 bg-dark bg-opacity-50"
            onClick={() => setIsSidebarOpen(false)}
            style={{ zIndex: 998 }}
          ></div>
        )}
      </div>

      {/* Custom CSS */}
      <style>
        {`
          body, html, #root {
            overflow: hidden;
          }
          
          .route-card {
            transition: transform 0.2s ease;
          }
          
          .route-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          
          .form-control {
            border-radius: 8px;
          }
          
          .btn {
            border-radius: 8px;
          }
          
          /* Responsive adjustments */
          @media (max-width: 991.98px) {
            .sidebar {
              position: fixed;
              left: 0;
              top: 0;
              height: 100%;
              transform: translateX(${isSidebarOpen ? '0' : '-100%'});
              transition: transform 0.3s ease;
            }
          }
          
          @media (max-width: 575.98px) {
            .card-body {
              padding: 0.75rem;
            }
            
            h2 {
              font-size: 1.3rem !important;
            }
            
            .badge {
              font-size: 0.65rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Navigation;