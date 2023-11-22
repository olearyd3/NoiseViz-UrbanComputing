import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useState, useEffect } from "react";

const Visualisations = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  let watchId;
  const calculateLocation = () => {
    if (navigator.geolocation) {
      const options = { enableHighAccuracy: true };
      const successCallback = (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        console.log(position.coords.latitude, position.coords.longitude);
      };

      const errorCallback = (error) => {
        console.error("Error getting location:", error);
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
    if (latitude != null && longitude != null) {
      // Initialize the map here
      // Make sure to only initialize the map when latitude and longitude are available
    }
  }, [latitude, longitude]);

  return (
    <div>
      <div>
        <h1>Visualisations</h1>
        <div id="map"></div>
      </div>
      {latitude !== null && longitude !== null && (
        <MapContainer center={[latitude, longitude]} zoom={13}>
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[latitude, longitude]}>
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
