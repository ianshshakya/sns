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
    <div className="d-flex flex-column flex-lg-row vh-100 vw-100 overflow-hidden">
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
      <div className="d-none d-lg-flex flex-column bg-light" style={{ width: "320px", minWidth: "320px" }}>
        <div className="d-flex flex-column justify-content-start p-3 h-100">
          {/* Header */}
          <div className="text-center mb-4 mt-3">
            <h5 className="mb-1" style={{"fontFamily":'"Gill Sans Extrabold", sans-serif'}}>Welcome to</h5>
            <h2 className="fw-bold" style={{"fontFamily":'"Gill Sans Extrabold", sans-serif', color: "#2c3e50"}}>
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
            <Link to="/Navigation" className="btn btn-outline-dark mb-3 py-2 d-flex align-items-center justify-content-center" style={{"fontFamily":'"Gill Sans Extrabold", sans-serif'}}>
              <i className="fa-solid fa-route me-2"></i>Start A Journey
            </Link>
            <Link to="/traffic" className="btn btn-outline-dark py-2 d-flex align-items-center justify-content-center" style={{"fontFamily":'"Gill Sans Extrabold", sans-serif'}}>
              <i className="fa-solid fa-traffic-light me-2"></i>Traffic Management
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-auto text-center">
            <h5 className="mb-0" style={{"fontFamily":'"Gill Sans Extrabold", sans-serif', color: "#7f8c8d"}}>~Made in India</h5>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1 position-relative overflow-hidden">
        {/* Map Section - Takes full height on mobile, part of screen on desktop */}
        <div className="flex-grow-1 position-relative">
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
        </div>

        {/* Mobile Content Panel (shown at bottom on mobile) */}
        <div className={`d-lg-none bg-light p-3 border-top ${isSidebarOpen ? 'd-block' : 'd-none'}`} style={{ maxHeight: "50vh", overflowY: "auto" }}>
          <div className="text-center mb-3">
            <h5 className="mb-1" style={{"fontFamily":'"Gill Sans Extrabold", sans-serif'}}>Welcome to</h5>
            <h4 className="fw-bold" style={{"fontFamily":'"Gill Sans Extrabold", sans-serif', color: "#2c3e50"}}>
              Smart Navigation System
            </h4>
          </div>

          {/* Location Section */}
          <div className="card shadow-sm mb-3">
            <div className="card-body text-center py-2">
              <button
                onClick={handleRecenter}
                className="btn btn-dark w-100 mb-2"
                style={{"fontFamily":'"Gill Sans Extrabold", sans-serif', fontSize: "0.9rem"}}>
                <i className="fa-solid fa-location-crosshairs" ></i>  &nbsp; Know Your Location
              </button>
              <div className="small text-muted mt-1" style={{minHeight: "30px", overflow: "hidden", textOverflow: "ellipsis"}}>
                {address || "Your location will appear here"}
              </div>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="d-flex flex-column">
            <Link 
              to="/Navigation" 
              className="btn btn-outline-dark mb-2 py-2 d-flex align-items-center justify-content-center" 
              style={{"fontFamily":'"Gill Sans Extrabold", sans-serif', fontSize: "0.9rem"}}
              onClick={() => setIsSidebarOpen(false)}
            >
              <i className="fa-solid fa-route me-2"></i>Start A Journey
            </Link>
            <Link 
              to="/traffic" 
              className="btn btn-outline-dark py-2 d-flex align-items-center justify-content-center" 
              style={{"fontFamily":'"Gill Sans Extrabold", sans-serif', fontSize: "0.9rem"}}
              onClick={() => setIsSidebarOpen(false)}
            >
              <i className="fa-solid fa-traffic-light me-2"></i>Traffic Management
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-3 text-center">
            <h6 className="mb-0" style={{"fontFamily":'"Gill Sans Extrabold", sans-serif', color: "#7f8c8d", fontSize: "0.8rem"}}>~Made in India</h6>
          </div>
        </div>
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
            
            .mobile-content-panel.hidden {
              transform: translateY(100%);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Home;