import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useState, useEffect } from "react";
import monitorInfo from "../monitorInfo.json";
import { fetchDataFromAPI } from "../components/data";

const Visualisations = ({ averageDecibel }) => {
  const [markers, setMarkers] = useState([]);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseData, setFirebaseData] = useState([]);
  let watchId;

  const calculateLocation = () => {
    if (navigator.geolocation) {
      const options = { enableHighAccuracy: true };
      const successCallback = (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        console.log(position.coords.latitude, position.coords.longitude);
        setLoading(false);
      };

      const errorCallback = (error) => {
        console.error("Error getting location:", error);
        setLoading(false);
      };

      watchId = navigator.geolocation.watchPosition(
        successCallback,
        errorCallback,
        options,
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      console.error("Geolocation is not enabled.");
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateLocation();

    // clean up the geolocation watch when the component unmounts
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    // simulating an asynchronous data fetch (e.g., loading from an API)
    setTimeout(async () => {
      const newMarkers = await Promise.all(
        monitorInfo.map(async (info) => {
          const data = await fetchDataFromAPI(info.serial_number);
          const latestData = data.length > 0 ? data[data.length - 1] : null;

          return {
            position: [parseFloat(info.latitude), parseFloat(info.longitude)],
            label: info.label,
            location: info.location,
            laeq: latestData ? latestData.laeq : null,
            timestamp: latestData ? latestData.datetime : null,
          };
        }),
      );

      setMarkers(newMarkers);
    }, 2000);
  }, [firebaseData]);

  const whiteMarker = new L.Icon({
    iconUrl:
      "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FFFFFF&chf=a,s,ee00FFFF",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const blueMarker = new L.Icon({
    iconUrl:
      "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|0099FF&chf=a,s,ee00FFFF",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  const yellowMarker = new L.Icon({
    iconUrl:
      "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FFF700&chf=a,s,ee00FFFF",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  const orangeMarker = new L.Icon({
    iconUrl:
      "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FFA500&chf=a,s,ee00FFFF",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  const redMarker = new L.Icon({
    iconUrl:
      "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FF0000&chf=a,s,ee00FFFF",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  const blackMarker = new L.Icon({
    iconUrl:
      "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|000000&chf=a,s,ee00FFFF",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const getMarkerIcon = (laeq) => {
    if (laeq === null) {
      return blueMarker;
    } else if (laeq < 50) {
      return blueMarker;
    } else if (laeq >= 50 && laeq < 70) {
      return yellowMarker;
    } else if (laeq >= 70 && laeq < 85) {
      return orangeMarker;
    } else if (laeq >= 85 && laeq <= 119) {
      return redMarker;
    } else {
      return blackMarker;
    }
  };

  return (
    <div>
      <div>
        <div id="map">{loading && <p>Loading Map...</p>}</div>
      </div>
      {latitude !== null && longitude !== null && !loading && (
        <MapContainer center={[latitude, longitude]} zoom={12}>
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((marker, index) => (
            <Marker
              key={index}
              position={marker.position}
              icon={getMarkerIcon(marker.laeq)}
            >
              <Popup>
                <div>
                  <strong>{marker.location}</strong>
                </div>
                <div>{marker.label}</div>
                {marker.laeq !== null && (
                  <div>
                    Most recent laeq reading: {marker.laeq.toFixed(2)} dB
                  </div>
                )}
                {marker.timestamp !== null && (
                  <div>
                    Last updated at:{" "}
                    {new Date(marker.timestamp).toLocaleString()}
                  </div>
                )}
              </Popup>
            </Marker>
          ))}
          <Marker position={[latitude, longitude]} icon={whiteMarker}>
            <Popup>
              Latitude: {latitude}, Longitude: {longitude}
              {averageDecibel !== null && (
                <div>Average Decibel: {averageDecibel.toFixed(2)} dB</div>
              )}
            </Popup>
          </Marker>
        </MapContainer>
      )}
      <div className="my-legend">
        <div className="legend-title">
          Map of Real-Time Noise Data in Dublin
        </div>
        <div className="legend-scale">
          <ul className="legend-labels">
            <li>
              <span style={{ background: "#0099FF" }}></span>
              <p>&lt;50 dB</p>
            </li>
            <li>
              <span style={{ background: "#FFF700" }}></span>
              <p>50-70 dB</p>
            </li>
            <li>
              <span style={{ background: "#FFA500" }}></span>
              <p>70-85 dB</p>
            </li>
            <li>
              <span style={{ background: "#FF0000" }}></span>
              <p>85-119 dB</p>
            </li>
            <li>
              <span style={{ background: "#000000" }}></span>
              <p>&gt;120 dB </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Visualisations;
