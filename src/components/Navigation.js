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

  const fetchRoutes = async () => {
    if (!destination) {
      alert("Please enter destination!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/get_routes", {
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

  return (
    <div className="d-flex vh-100 vw-100 overflow-hidden">
      {/* Sidebar */}
      <div className="d-flex flex-column bg-light" style={{ width: "350px", minWidth: "350px", overflowY: "auto" }}>
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
        <div className="position-absolute bottom-0 end-0 m-3 bg-white p-2 rounded shadow-sm small">
          <div className="d-flex align-items-center">
            <i className="fa-solid fa-circle-info text-primary me-1"></i>
            <span>Use ctrl + scroll to zoom map</span>
          </div>
        </div>
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
        `}
      </style>
    </div>
  );
};

export default Navigation;