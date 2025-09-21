import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import MapComponent from "./MapComponent";
import axios from "axios";

const Home = () => {
  const mapRef = useRef();
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.recenter(); 
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/navigation", { state: { from, to } });
  };

  const handleLocationChange = async (newLoc) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse`,
        {
          params: {
            lat: newLoc[0],
            lon: newLoc[1],
            format: "json",
          },
        }
      );

      if (response.data && response.data.display_name) {
        setAddress(response.data.display_name);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
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
          maxWidth: "320px",
          zIndex: 999,
          boxShadow: "2px 0 10px rgba(0,0,0,0.1)"
        }}
      >
        <div className="d-flex flex-column justify-content-start p-3 h-100">
          {/* Header */}
          <div className="text-center mb-4 mt-3">
            <h5 className="mb-1" style={{"fontFamily":'"Gill Sans Extrabold", sans-serif'}}>Welcome to</h5>
            <h2 className="fw-bold" style={{"fontFamily":'"Gill Sans Extrabold", sans-serif', color: "#2c3e50", fontSize: "1.5rem"}}>
              Smart Navigation System
            </h2>
          </div>

          {/* Location Section */}
          <div className="card shadow-sm mb-4">
            <div className="card-body text-center">
              <button
                onClick={handleRecenter}
                className="btn btn-dark w-100 mb-2"
                style={{"fontFamily":'"Gill Sans Extrabold", sans-serif'}}>
                <i className="fa-solid fa-location-crosshairs" ></i>  &nbsp; Know Your Location
              </button>
              <div className="small text-muted mt-2" style={{minHeight: "40px", overflow: "hidden", textOverflow: "ellipsis"}}>
                {address || "Your location will appear here"}
              </div>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="d-flex flex-column mb-4">
            <Link 
              to="/Navigation" 
              className="btn btn-outline-dark mb-3 py-2 d-flex align-items-center justify-content-center" 
              style={{"fontFamily":'"Gill Sans Extrabold", sans-serif'}}
              onClick={() => window.innerWidth < 992 && setIsSidebarOpen(false)}
            >
              <i className="fa-solid fa-route me-2"></i>Start A Journey
            </Link>
            <Link 
              to="/traffic" 
              className="btn btn-outline-dark py-2 d-flex align-items-center justify-content-center" 
              style={{"fontFamily":'"Gill Sans Extrabold", sans-serif'}}
              onClick={() => window.innerWidth < 992 && setIsSidebarOpen(false)}
            >
              <i className="fa-solid fa-traffic-light me-2"></i>Traffic Management
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-auto text-center">
            <h5 className="mb-0" style={{"fontFamily":'"Gill Sans Extrabold", sans-serif', color: "#7f8c8d", fontSize: "0.9rem"}}>~Made in India</h5>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="d-flex flex-column flex-grow-1 position-relative">
        <MapComponent 
          ref={mapRef} 
          onLocationChange={handleLocationChange} 
          mapProvider="OSM" 
          style={{ height: "100%", width: "100%" }}
        />
        {/* Location Marker */}
        <div className="position-absolute top-50 start-50 translate-middle">
          <div className="bg-danger rounded-circle" style={{ width: "20px", height: "20px", border: "3px solid white", boxShadow: "0 0 0 3px rgba(255,0,0,0.5)" }}></div>
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
          
          .btn {
            border-radius: 8px;
            transition: all 0.2s ease;
          }
          
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          
          .card {
            border-radius: 12px;
            border: none;
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
            .sidebar-content {
              padding: 1rem;
            }
            
            h2 {
              font-size: 1.3rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Home;