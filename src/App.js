import React, { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";

import shovelImage from "./assets/shovel.png";
import openHand from "./assets/openhand.svg";

import PlantModal from "./PlantModal";
import "./App.css";
import "./mapbox-gl-geocoder.css";
import * as Realm from "realm-web";

const REALM_APP_ID = "app_0-eioot";
mapboxgl.accessToken =
  "pk.eyJ1IjoibXVyYXRzdSIsImEiOiJja29qbjl1czIwNWgwMm5vN2p1cms3bTkwIn0.bayqcklLCk7RhaoQcSSP5Q";

// Create a marker div
const createMarker = (coordinates, description) => {
  // create a HTML element for each feature
  var el = document.createElement("div");
  el.className = "marker";

  // make a marker for each feature and add to the map
  return new mapboxgl.Marker(el).setLngLat(coordinates).setPopup(
    new mapboxgl.Popup({ offset: 25 }) // add popups
      .setHTML(`<p style="word-wrap: break-word;">${description}</p>`)
  );
};

// Entry point for the app
function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [state, setState] = useState({
    isPlanting: false,
    insertMode: false,
    userLocation: [28.97, 41.01],
    targetLocation: [0, 0],
    db: null,
    placeMarkers: [],
    zoom: 9
  });

  const getNearbyDaisies = async (db, position) => {
    if (!db) return [];
    // console.log(state.zoom)
    let daisyLocs = await db.collection("daisy_locations").find({
        "location": {
            "$near": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": position
                },
                // "$maxDistance": 100000 * (1 / state.zoom)
            }
        }
    })
    
    // console.log(daisyLocs.length)

    return daisyLocs.map((daisy) =>
      createMarker(daisy.location.coordinates, daisy.description)
    );
  };

  useEffect(() => {
    if (map.current) return; // initialize map only once
    // Init map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: state.userLocation,
      zoom: state.zoom,
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false,
      placeholder: "Search city",
      flyTo: { maxDuration: 1000 },
    });

    map.current.on('moveend', function() {
      const zoom = map.current.getZoom();    
      const { lng, lat } = map.current.getCenter();

      setState(state => ({
        ...state,
        zoom,
        userLocation: [lng, lat]
      }));

      // Re-render flowers
      // console.log('event:moveend');
    });

    document
      .getElementById("geocoder-wrapper")
      .appendChild(geocoder.onAdd(map.current));

    const init = async () => {
      // Init database stuff
      const realmApp = new Realm.App({ id: REALM_APP_ID });
      const credentials = Realm.Credentials.anonymous();
      await realmApp.logIn(credentials);
      const db = realmApp.currentUser.mongoClient("mongodb-atlas").db("daisy");

      setState(state => ({
        ...state,
        db
      }));
    };
    init();
  });

  const changeMode = useCallback(
    (e, force = false) => {
      if (state.insertMode || force) {
        map.current.getCanvas().style.cursor = "";
        setState(state => ({
          ...state,
          insertMode: false
        }));
      } else {
        map.current.getCanvas().style.cursor = "crosshair";
        setState(state => ({
          ...state,
          insertMode: true
        }));
      }
    },
    [state.insertMode]
  );

  const togglePlantModal = useCallback(() => {
    if (state.isPlanting) {
      setState((state) => ({
        ...state,
        isPlanting: false,
      }));
      changeMode(null, true);
    } else {
      setState((state) => ({
        ...state,
        isPlanting: true,
      }));
    }
  }, [changeMode, state.isPlanting]);

  useEffect(() => {
    const mapMouseDown = (e) => {
      // make sure map is loaded
      if (!state.insertMode) return;

      setState((prevState) => ({
        ...prevState,
        targetLocation: [e.lngLat.lng, e.lngLat.lat],
      }));
      togglePlantModal();
    };

    map.current.on("mouseup", mapMouseDown);
    return () => {
      map.current.off("mouseup", mapMouseDown);
    };
  }, [state.insertMode, togglePlantModal]);

  // Remove old daisies
  useEffect(() => {
    state.placeMarkers.forEach(marker => marker.remove());
  }, [state.placeMarkers]);

  // Fetch new daisies
  useEffect(() => {
    const [lng, lat] = state.userLocation;
    
    const fetchDaisies = async () => {
      const placeMarkers = await getNearbyDaisies(state.db, [lng, lat]);
      setState(state => ({
        ...state,
        placeMarkers
      }))
    };

    fetchDaisies();
  }, [state.userLocation, state.db]);

  // Render when place markers change
  useEffect(() => {
    state.placeMarkers.forEach((marker) => marker.addTo(map.current));
  }, [state.placeMarkers]);

  const plantFlower = (message = "") => {
    // Add Marker on the local map
    const marker = createMarker(state.targetLocation, message);
    marker.addTo(map.current);

    // Add Marker to the database - async
    state.db.collection("daisy_locations").insertOne({
      description: message,
      location: {
        type: "Point",
        coordinates: state.targetLocation
      }
    });

    // Toggle the modal
    togglePlantModal();
  };

  return (
    <div className="main-container">
      <PlantModal
        isOpen={state.isPlanting}
        onRequestClose={togglePlantModal}
        onSubmit={plantFlower}
      />
      <div id="map-wrapper">
        <div ref={mapContainer} id="map" />
      </div>
      {/* <img className="top-menu-image" src={plantFlowerPicture} alt="" /> */}
      <div className="shovel-action-button" onClick={changeMode}>
        {state.insertMode ? (
          <img className="shovel-image" src={openHand} alt=""/>
        ) : (
          <img className="shovel-image" src={shovelImage} alt=""/>
        )}
      </div>
      <div id="geocoder-wrapper"></div>
    </div>
  );
}

export default App;
