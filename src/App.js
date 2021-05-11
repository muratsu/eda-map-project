import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax

import { IoFlowerSharp } from "react-icons/io5";

import "./App.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoibXVyYXRzdSIsImEiOiJja29qbjl1czIwNWgwMm5vN2p1cms3bTkwIn0.bayqcklLCk7RhaoQcSSP5Q";

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(9);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [lng, lat],
      zoom: zoom,
    });
  });

  return (
    <div id="map-wrapper">     
      <div ref={mapContainer} id="map" />
      {/* <div class="action-tag-mode"> */}
        <IoFlowerSharp />
      {/* </div> */}
    </div>
  );
}

export default App;
