import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import axios from "axios";

import Home from "./components/home";
import Navigation from "./components/Navigation";
import TrafficDashboard from "./components/TrafficManagement";




function App() {
  // const [traffic, setTraffic] = useState({ north_south: 0, east_west: 0, total: 0 });

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     axios.get("http://localhost:8000/data")
  //       .then(res => setTraffic(res.data))
  //       .catch(err => console.error(err));
  //   }, 1000); // update every second

  //   return () => clearInterval(interval);
  // }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/navigation" element={<Navigation/>}/>
        <Route path="/traffic" element ={<TrafficDashboard/>}/>
      
        
      </Routes>
   
      
      

      {/* Video stream 
      <img 
        src="http://localhost:8000/video" 
        alt="Traffic Stream" 
        style={{ width: "800px", border: "2px solid black" }}
      />

     
      <div>
        <p>North-South: {traffic.north_south}</p>
        <p>East-West: {traffic.east_west}</p>
        <p>Total: {traffic.total}</p>
      </div>*/}
       </Router>

  );
}

export default App;
