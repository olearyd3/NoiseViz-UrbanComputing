import { useEffect, useState, useRef } from "react";
import "../App.css";
import { db } from "../config/firebase";
import { getDocs, collection, addDoc } from "firebase/firestore";
import { fetchDataFromAPI } from "../components/data";

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

      // get data from the API
      const data = await fetchDataFromAPI();

      const openDataCollectionRef = collection(db, "sonitus-dolphins-barn");

      // get the existing data from Firebase and store in a map
      const existingData = await getDocs(openDataCollectionRef);
      const existingDataMap = new Map();

      // creating a map of the existing data with datetime values as keys
      existingData.docs.forEach((doc) => {
        const docData = doc.data();
        existingDataMap.set(docData.datetime, docData);
      });

      // filter out data that is already on Firebase for the current monitor based on its datetime
      const newData = data.filter(
        (item) => !existingDataMap.has(item.datetime),
      );

      // if no new data, print up-to-date
      if (newData.length === 0) {
        console.log("Data already up-to-date");
      } else {
        // add the new data to Firebase
        for (const item of newData) {
          try {
            await addDoc(openDataCollectionRef, item);
            console.log("Uploaded data: ", item);
          } catch (error) {
            console.error("Error adding document: ", error);
          }
        }
        // print that the data was successfully uploaded
        setLoading(false);
        openModal("Data successfully uploaded to Firebase!");
        console.log("Successfully uploaded data to Firebase!");
      }
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
    // Request permission to access the microphone
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        // Create an audio context
        var audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        var analyser = audioContext.createAnalyser();

        // Connect the microphone stream to the analyser
        var microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        // Set up the analyser to get time-domain data
        analyser.fftSize = 256;
        var bufferLength = analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);

        // Function to calculate decibel levels
        function calculateDecibels() {
          if (!isUnmounted && microphoneActive) {
            analyser.getByteFrequencyData(dataArray);

            // Calculate the average amplitude
            var sum = dataArray.reduce(function (acc, val) {
              return acc + val;
            }, 0);
            var average = sum / bufferLength;

            // using 94 as DeciBel calibration value
            var decibels = 20 * Math.log10(average / 255) + 94;

            if (decibels !== -Infinity) {
              decibelReadingsRef.current.push(decibels);
            }

            // Send decibel level to your server or do something with it
            //console.log("Decibels:", decibels);
          }
          // Repeat the process
          if (!isUnmounted) {
            requestAnimationFrame(calculateDecibels);
          }
        }

        // Start calculating decibel levels
        calculateDecibels();
      })
      .catch(function (err) {
        console.error("Error accessing microphone:", err);
      });
    return () => {
      isUnmounted = true;
    };
  }, [microphoneActive]);

  const handleMicrophoneButtonClick = () => {
    startMicrophone();
    decibelReadingsRef.current = [];
    // Stop measuring after 5 seconds
    setTimeout(() => {
      stopMicrophone();

      const readings = decibelReadingsRef.current;
      if (readings.length > 0) {
        const sum = readings.reduce((acc, val) => acc + val, 0);
        const average = sum / readings.length;
        setAverageDecibel(average);
        console.log("Average Decibels:", average);
      } else {
        console.log("No valid decibel readings.");
      }
    }, 5000);
  };
  return (
    <div className="App">
      <h1>Urban Computing Assignment 3</h1>
      <div>
        <button onClick={uploadOpenData}>
          Upload real-time noise data from Dolphin's Barn to Firebase using
          Sonitus API
        </button>
      </div>
      <div>
        <button onClick={handleMicrophoneButtonClick}>
          Start Measuring Decibels for 5 Seconds
        </button>
        {averageDecibel !== null && (
          <p>
            Average Decibel reading over the last 5 seconds:{" "}
            {averageDecibel.toFixed(2)}
          </p>
        )}
      </div>
      <div>
        <button onClick={uploadLocationToFirebase}>
          Upload Current Location to Firebase
        </button>
      </div>
      <div className="locationData">
        <h2>Current Coordinates</h2>
        <p>Latitude: {latitude}</p>
        <p>Longitude: {longitude}</p>
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
