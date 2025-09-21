import React, { useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const colors = ["#ff0000", "#0000ff", "#00ff00", "#ff9900", "#9900ff"];

// Component to handle map recentering
function RecenterMap({ center }) {
  const map = useMap();
  React.useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

const Navigation = () => {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState([]);
  const [startCoords, setStartCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentCenter, setCurrentCenter] = useState([28.6139, 77.209]);

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
      
      // Auto-recenter to show both start and destination
      if (data.start_coords && data.dest_coords) {
        const lat = (data.start_coords[0] + data.dest_coords[0]) / 2;
        const lng = (data.start_coords[1] + data.dest_coords[1]) / 2;
        setCurrentCenter([lat, lng]);
      } else if (data.dest_coords) {
        setCurrentCenter(data.dest_coords);
      }
    } catch (err) {
      console.error("Error fetching routes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleRecenter = () => {
    if (startCoords && destCoords) {
      const lat = (startCoords[0] + destCoords[0]) / 2;
      const lng = (startCoords[1] + destCoords[1]) / 2;
      setCurrentCenter([lat, lng]);
    } else if (destCoords) {
      setCurrentCenter(destCoords);
    } else {
      setCurrentCenter([28.6139, 77.209]);
    }
  };

  return (
    <div className="d-flex flex-column flex-lg-row vh-100 vw-100">
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

      {/* Sidebar for Desktop */}
      <div className="d-none d-lg-flex flex-column bg-light" style={{ width: "350px", minWidth: "350px" }}>
        <div className="d-flex flex-column p-3 h-100">
          {/* Header */}
          <div className="text-center mb-4 mt-3">
            <h2 className="fw-bold" style={{fontFamily: '"Gill Sans Extrabold", sans-serif', color: "#2c3e50"}}>
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
              
              <div className="d-flex gap-2">
                <button
                  onClick={fetchRoutes}
                  disabled={isLoading || !destination}
                  className="btn btn-dark w-75 py-2"
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
                <button
                  onClick={handleRecenter}
                  className="btn btn-outline-secondary w-25 py-2"
                  title="Recenter Map"
                >
                  <i className="fa-solid fa-location-crosshairs"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Routes List */}
          <div className="flex-grow-1" style={{ overflowY: "auto" }}>
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
                        <h6 className="card-title mb-1">
                          <span className="badge bg-secondary me-2">{i + 1}</span>
                          {r.summary}
                        </h6>
                        <span className="badge rounded-pill" style={{backgroundColor: colors[i % colors.length]}}>
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

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1 position-relative">
        {/* Map Section - Takes full height */}
        <div className="flex-grow-1 position-relative">
          <MapContainer
            center={currentCenter}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <RecenterMap center={currentCenter} />
            
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

          {/* Recenter Button for Mobile */}
          <button
            onClick={handleRecenter}
            className="btn btn-dark position-absolute d-lg-none"
            style={{
              bottom: "70px",
              right: "10px",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 500
            }}
            title="Recenter Map"
          >
            <i className="fa-solid fa-location-crosshairs"></i>
          </button>
        </div>

        {/* Mobile Content Panel (shown at bottom on mobile) */}
        <div className={`d-lg-none bg-light p-3 border-top ${isSidebarOpen ? 'd-block' : 'd-none'}`} style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <div className="text-center mb-3">
            <h4 className="fw-bold" style={{fontFamily: '"Gill Sans Extrabold", sans-serif', color: "#2c3e50"}}>
              Start A Journey
            </h4>
          </div>

          {/* Input Section */}
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <div className="mb-2">
                <label htmlFor="start-mobile" className="form-label fw-semibold small">Start Location</label>
                <input
                  id="start-mobile"
                  type="text"
                  placeholder="Enter Start (optional)"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="form-control form-control-sm"
                />
                <div className="form-text small">Leave empty to use current location</div>
              </div>
              
              <div className="mb-2">
                <label htmlFor="destination-mobile" className="form-label fw-semibold small">Destination *</label>
                <input
                  id="destination-mobile"
                  type="text"
                  placeholder="Enter Destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="form-control form-control-sm"
                  required
                />
              </div>
              
              <div className="d-flex gap-2">
                <button
                  onClick={fetchRoutes}
                  disabled={isLoading || !destination}
                  className="btn btn-dark w-75 py-2 btn-sm"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Find Routes
                    </>
                  ) : (
                    "Get Routes"
                  )}
                </button>
                <button
                  onClick={handleRecenter}
                  className="btn btn-outline-secondary w-25 py-2 btn-sm"
                  title="Recenter Map"
                >
                  <i className="fa-solid fa-location-crosshairs"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Routes List */}
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            <h5 className="mb-2">Available Routes</h5>
            
            {routes.length === 0 ? (
              <div className="text-center text-muted py-2">
                <i className="fa-solid fa-route fa-lg mb-1 d-block"></i>
                <p className="small mb-0">No routes yet. Enter destination above.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-1">
                {routes.map((r, i) => (
                  <div 
                    key={i} 
                    className="card route-card"
                    style={{borderLeft: `3px solid ${colors[i % colors.length]}`}}
                  >
                    <div className="card-body py-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="card-title mb-1 small">
                          <span className="badge bg-secondary me-1">{i + 1}</span>
                          {r.summary}
                        </h6>
                        <span className="badge rounded-pill small" style={{backgroundColor: colors[i % colors.length], fontSize: "0.65rem"}}>
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

      {/* Custom CSS */}
      <style>
        {`
          body, html, #root {
            height: 100%;
          }
          
          .route-card {
            transition: transform 0.2s ease;
          }
          
          .route-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          
          .form-control {
            border-radius: 6px;
          }
          
          .btn {
            border-radius: 6px;
          }
          
          /* Mobile-specific styles */
          @media (max-width: 991.98px) {
            .mobile-content-panel {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              border-top-left-radius: 16px;
              border-top-right-radius: 16px;
              box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
              transition: transform 0.3s ease;
              z-index: 999;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Navigation;