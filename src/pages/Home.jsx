import { useEffect, useState, useRef } from "react";
import "../App.css";
import { db } from "../config/firebase";
import { getDocs, collection, addDoc } from "firebase/firestore";
import { fetchDataFromAPI } from "../components/data";
import monitorInfo from "../monitorInfo.json";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import Visualisations from "./Visualisations";

function Home() {
  // loading wheel and modal states
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const timeoutRef = useRef(null);

  // handling opening and closing the modal
  const openModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setModalMessage("");
    setShowModal(false);
  };

  const uploadOpenData = async () => {
    try {
      setLoading(true);
      console.log("Started fetching and uploading data...");

      // loop through each monitor in monitorInfo.json
      for (const monitor of monitorInfo) {
        const serialNumber = monitor.serial_number;

        // get data from the API for each monitor
        const data = await fetchDataFromAPI(serialNumber);
        const openDataCollectionRef = collection(db, "sonitus-data-from-api");

        // get the existing data from Firebase and store in a map
        const existingData = await getDocs(openDataCollectionRef);
        const existingDataMap = new Map();

        // creating a map of the existing data with datetime values as keys
        existingData.docs.forEach((doc) => {
          const docData = doc.data();
          const compositeKey = `${docData.datetime}_${docData.serial_number}`;
          existingDataMap.set(compositeKey, docData);
        });

        // filter out data that is already on Firebase for the current monitor based on its datetime
        const newData = data.filter((item) => {
          const compositeKey = `${item.datetime}_${serialNumber}`;
          return !existingDataMap.has(compositeKey);
        });

        // if no new data, print up-to-date
        if (newData.length === 0) {
          console.log(`Data for monitor ${serialNumber} is already up-to-date`);
        } else {
          // add the new data to Firebase along with serial_number
          for (const item of newData) {
            try {
              await addDoc(openDataCollectionRef, {
                ...item,
                serial_number: serialNumber,
              });
              console.log(`Uploaded data for monitor ${serialNumber}: `, item);
            } catch (error) {
              console.error(
                `Error adding document for monitor ${serialNumber}: `,
                error,
              );
            }
          }
          // print that the data was successfully uploaded
          console.log(
            `Successfully uploaded data for monitor ${serialNumber} to Firebase!`,
          );
        }
      }

      setLoading(false);
      openModal("Data successfully uploaded to Firebase!");
      setFirebaseData(newData);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
      openModal("Error uploading data: " + error);
    }
  };

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const calculateLocation = () => {
    if (navigator.geolocation) {
      // get the user's current latitude and longitude
      const options = { enableHighAccuracy: true };
      const successCallback = (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        console.log(position.coords.latitude, position.coords.longitude);
      };

      const errorCallback = (error) => {
        console.error("Error getting location:", error);
      };

      // constantly watch the position with callbacks
      const watchId = navigator.geolocation.watchPosition(
        successCallback,
        errorCallback,
        options,
      );

      // clear when unmounted
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      // if browser does not support geolocation
      console.error("Geolocation is not enabled.");
    }
  };

  // load calculateLocation once when the component mounts
  useEffect(() => {
    calculateLocation();
  }, []);

  // method to upload current location to Firebase
  const uploadLocationToFirebase = async () => {
    // if there are values for longitude and latitude
    if (latitude !== null && longitude !== null) {
      const locationData = {
        // set datetime to the current date and time
        datetime: new Date(),
        latitude,
        longitude,
      };
      // the collection on Firebase
      const locationDataCollectionRef = collection(db, "location-data");
      try {
        setLoading(true);
        // create a timeout warning if it takes too long to load
        timeoutRef.current = setTimeout(() => {
          setLoading(false);
          openModal("An error has occurred: Firebase Quota exceeded for today");
        }, 5000);
        // add the doc
        await addDoc(locationDataCollectionRef, locationData);
        // if data successfully uploaded
        setLoading(false);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        // display modal with successful upload
        openModal("Location data successfully uploaded to Firebase!");
        console.log("Uploaded location data to Firebase: ", locationData);
      } catch (error) {
        // if data fails
        console.error("Error adding location document: ", error);
      }
    } else {
      // if data fails
      setLoading(false);
      openModal("Error uploading location data: " + error);
      console.error("Location data is not available.");
    }
  };

  const [microphoneActive, setMicrophoneActive] = useState(false);

  const startMicrophone = () => {
    setMicrophoneActive(true);
  };

  const stopMicrophone = () => {
    setMicrophoneActive(false);
  };

  const decibelReadingsRef = useRef([]);
  const [averageDecibel, setAverageDecibel] = useState(null);

  useEffect(() => {
    let isUnmounted = false;
    // request permission to access the microphone
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        // create an audio context
        var audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        var analyser = audioContext.createAnalyser();

        // connect the microphone stream to the analyser
        var microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        // set up the analyser to get time-domain data
        analyser.fftSize = 256;
        var bufferLength = analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);

        // function to calculate decibel levels
        function calculateDecibels() {
          if (!isUnmounted && microphoneActive) {
            analyser.getByteFrequencyData(dataArray);

            // calculate the average amplitude
            var sum = dataArray.reduce(function (acc, val) {
              return acc + val;
            }, 0);
            var average = sum / bufferLength;

            // using 94 as DeciBel calibration value
            var decibels = 20 * Math.log10(average / 255) + 94;

            if (decibels !== -Infinity) {
              decibelReadingsRef.current.push(decibels);
            }
          }
          // repeat if not unmounted
          if (!isUnmounted) {
            requestAnimationFrame(calculateDecibels);
          }
        }
        // calc decibel levels
        calculateDecibels();
      })
      .catch(function (err) {
        console.error("Error accessing microphone:", err);
      });
    return () => {
      isUnmounted = true;
    };
  }, [microphoneActive]);

  const handleMicrophoneButtonClick = async () => {
    startMicrophone();
    decibelReadingsRef.current = [];
    // stop measuring after 5 seconds
    const startTime = new Date();

    setTimeout(async () => {
      stopMicrophone();

      const readings = decibelReadingsRef.current;
      if (readings.length > 0) {
        const sum = readings.reduce((acc, val) => acc + val, 0);
        const average = sum / readings.length;
        setAverageDecibel(average);
        const locationData = {
          datetime: new Date(),
          latitude,
          longitude,
        };

        // upload data to Firebase
        const decibelCollectionRef = collection(db, "location-decibel-data");
        try {
          setLoading(true);

          // upload average decibel data
          await addDoc(decibelCollectionRef, {
            datetime: startTime,
            latitude,
            longitude,
            averageDecibel: average,
          });

          setLoading(false);
          console.log("Data uploaded to Firebase:", {
            datetime: startTime,
            latitude,
            longitude,
            averageDecibel: average,
          });
        } catch (error) {
          console.error("Error uploading data to Firebase:", error);
          setLoading(false);
          openModal("Error uploading data to Firebase: " + error);
        }
      } else {
        console.log("No valid decibel readings.");
      }
    }, 5000);
  };

  return (
    <div className="App">
      <h1></h1>
      <div
        className="homeButtons"
        style={{ display: "flex", flexDirection: "row" }}
      >
        <div style={{ flex: 1 }}>
          <Visualisations averageDecibel={averageDecibel} />
        </div>
        <div style={{ flex: 1 }}>
          <button
            className="home-page-button"
            style={{ "--clr": "#39FF14" }}
            onClick={uploadOpenData}
          >
            <span>
              Upload real-time noise data to Firebase using Sonitus API
            </span>
            <i></i>
          </button>
          <button
            className="home-page-button"
            style={{ "--clr": "#FF44CC" }}
            onClick={handleMicrophoneButtonClick}
          >
            <span>
              Start Measuring Decibels for 5 Seconds and upload to Firebase
            </span>
            <i></i>
          </button>
          {averageDecibel !== null && (
            <p>
              Average Decibel reading over the last 5 seconds:{" "}
              {averageDecibel.toFixed(2)}
            </p>
          )}
          <button
            className="home-page-button"
            style={{ "--clr": "#0FF0FC" }}
            onClick={uploadLocationToFirebase}
          >
            <span>Upload Current Location to Firebase</span>
            <i></i>
          </button>
        </div>
      </div>
      {loading && <div className="loading-spinner"></div>}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>
              &times;
            </span>
            <p>{modalMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
