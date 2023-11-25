import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useState, useEffect } from "react";
import monitorInfo from "../monitorInfo.json";

const Visualisations = () => {
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
    setTimeout(() => {
      // Transform monitorInfo.json data into markers array
      const newMarkers = monitorInfo.map((info) => ({
        position: [parseFloat(info.latitude), parseFloat(info.longitude)],
        label: info.label,
        location: info.location,
      }));

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

  return (
    <div>
      <div>
        <h1>Visualisations</h1>
        <div id="map">{loading && <p>Loading Map...</p>}</div>
      </div>
      {latitude !== null && longitude !== null && !loading && (
        <MapContainer center={[latitude, longitude]} zoom={12}>
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((marker, index) => (
            <Marker key={index} position={marker.position} icon={blueMarker}>
              <Popup>
                <div>
                  <strong>{marker.location}</strong>
                </div>
                <div>{marker.label}</div>
              </Popup>
            </Marker>
          ))}
          <Marker position={[latitude, longitude]} icon={whiteMarker}>
            <Popup>
              Latitude: {latitude}, Longitude: {longitude}
            </Popup>
          </Marker>
        </MapContainer>
      )}
    </div>
  );
};

export default Visualisations;
