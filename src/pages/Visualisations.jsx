import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useState, useEffect } from "react";
import monitorInfo from "../monitorInfo.json";
import { fetchDataFromAPI } from "../components/data";

const Visualisations = ({ averageDecibel }) => {
  const [markers, setMarkers] = useState([]);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loading, setLoading] = useState(true);
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

    // Clean up the geolocation watch when the component unmounts
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    // Simulating an asynchronous data fetch (e.g., loading from an API)
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
    }, 2000); // Simulating a 2-second delay; replace this with your actual data fetching logic
  }, []);

  const whiteMarker = new L.Icon({
    iconUrl:
      "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FFFFFF&chf=a,s,ee00FFFF", // Replace with the path to your black marker icon
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const blueMarker = new L.Icon({
    iconUrl:
      "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|0099FF&chf=a,s,ee00FFFF", // Replace with the path to your black marker icon
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  const yellowMarker = new L.Icon({
    iconUrl:
      "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FFF700&chf=a,s,ee00FFFF", // Replace with the path to your black marker icon
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  const orangeMarker = new L.Icon({
    iconUrl:
      "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FFA500&chf=a,s,ee00FFFF", // Replace with the path to your black marker icon
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  const redMarker = new L.Icon({
    iconUrl:
      "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FF0000&chf=a,s,ee00FFFF", // Replace with the path to your black marker icon
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  const blackMarker = new L.Icon({
    iconUrl:
      "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|000000&chf=a,s,ee00FFFF", // Replace with the path to your black marker icon
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

  const Legend = () => {
    return (
      <div>
        <p>
          Legend:
          <span style={{ color: "#0099FF" }}> Blue: Low Noise (&lt;50 dB)</span>
          ,
          <span style={{ color: "#FFF700" }}>
            {" "}
            Yellow: Moderate Noise (50-70 dB)
          </span>
          ,
          <span style={{ color: "#FFA500" }}>
            {" "}
            Orange: Loud Noise (70-85 dB)
          </span>
          ,
          <span style={{ color: "#FF0000" }}>
            {" "}
            Red: Very Loud Noise (86-120 dB)
          </span>
          ,
          <span style={{ color: "#000000" }}>
            {" "}
            Black: Dangerous Noise (120 dB +)
          </span>
        </p>
      </div>
    );
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
      <Legend />
    </div>
  );
};

export default Visualisations;
