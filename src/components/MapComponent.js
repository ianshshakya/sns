import React, { useState, useImperativeHandle, forwardRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Define map providers
const MAP_PROVIDERS = {
  OSM: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  },
  CARTO_DARK: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
  },
  CARTO_LIGHT: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
  },
  STAMEN_TONER: {
    url: "https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png",
    attribution:
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  },
  ESRI: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri — Source: Esri, DeLorme, NAVTEQ, USGS, Intermap",
  },
};

// Helper component to recenter the map
function RecenterMap({ center }) {
  const map = useMap();
  if (center) map.setView(center, map.getZoom(), { animate: true });
  return null;
}

const MapLeaflet = forwardRef(({ onLocationChange, mapProvider = "CARTO_DARK" }, ref) => {
  const [loc, setLoc] = useState([28.6139, 77.209]); // default Delhi

  const recenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc = [pos.coords.latitude, pos.coords.longitude];
          setLoc(newLoc);
          if (onLocationChange) {
            onLocationChange(newLoc); // send to parent
          }
        },
        (err) => console.error(err)
      );
    }
  };

  // expose recenter to parent
  useImperativeHandle(ref, () => ({
    recenter,
  }));

  const provider = MAP_PROVIDERS[mapProvider] || MAP_PROVIDERS.CARTO_DARK;

  return (
    <MapContainer
      center={loc}
      zoom={15}
      style={{
        height: "100%",
        width: "100%",
        borderRadius: "15px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      <TileLayer attribution={provider.attribution} url={provider.url} />
      <Marker position={loc}>
        <Popup>📍 You are here!</Popup>
      </Marker>
      <RecenterMap center={loc} />
    </MapContainer>
  );
});

export default MapLeaflet;
