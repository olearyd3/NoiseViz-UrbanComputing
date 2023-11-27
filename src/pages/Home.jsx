import { useEffect, useState, useRef } from "react";
import "../App.css";
import { db } from "../config/firebase";
import { getDocs, collection, addDoc } from "firebase/firestore";
import { fetchDataFromAPI } from "../components/data";
import monitorInfo from "../monitorInfo.json";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import Visualisations from "./Visualisations";
import * as d3 from "d3";

function Home() {
  // states and refs
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const timeoutRef = useRef(null);
  const [selectedMonitor, setSelectedMonitor] = useState("01550");

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
        const data = await fetchDataFromAPI(serialNumber, false);
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

  // get data for the appropriate monitor
  const fetchMonitorData = async () => {
    const serialNumber = selectedMonitor;
    const data = await fetchDataFromAPI(serialNumber, true);
    console.log(data);
    // get the last six hours of data
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    const filteredData = data.filter(
      (item) => new Date(item.datetime) >= sixHoursAgo,
    );
    console.log(filteredData);
    // draw the line chart
    drawLineChart(filteredData);
  };

  // d3 stuff to draw line chart
  const drawLineChart = (data) => {
    const chartContainer = d3.select(".chart-container");
    chartContainer.selectAll("svg").remove();
    // set up the dimensions of the line chart
    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    function handleMouseMove(event) {
      const mouseX = d3.pointer(event)[0] - margin.left;
      const date = xScale.invert(mouseX);

      // find closest data point
      const bisectDate = d3.bisector((d) => parseTime(d.datetime)).left;
      const index = bisectDate(data, date, 1);
      const leftData = data[index - 1];
      const rightData = data[index];

      // determine which data point is closer to the mouse position
      const closestData =
        rightData &&
        date - parseTime(leftData.datetime) >
          parseTime(rightData.datetime) - date
          ? rightData
          : leftData;

      // show tooltip at the mouse position with y-value information
      tooltip
        .html(
          `<strong>Date:</strong> ${
            closestData.datetime
          }<br/><strong>Decibel:</strong> ${closestData.laeq.toFixed(2)}`,
        )
        .style("left", `${event.pageX}px`)
        .style("top", `${event.pageY - 28}px`);
    }

    // chart container
    const svg = chartContainer
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    const xScale = d3.scaleTime().range([0, innerWidth]);
    const yScale = d3.scaleLinear().range([innerHeight, 0]);

    const tooltip = d3
      .select(".chart-container")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // rectangle to capture mouse events
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", () => tooltip.style("opacity", 1))
      .on("mousemove", handleMouseMove)
      .on("mouseout", () => tooltip.style("opacity", 0));

    // set up the line for the chart
    const line = d3
      .line()
      .x((d) => xScale(parseTime(d.datetime)) + margin.left)
      .y((d) => yScale(d.laeq) + margin.top);

    // set the scale limits
    xScale.domain(d3.extent(data, (d) => parseTime(d.datetime)));
    yScale.domain([0, d3.max(data, (d) => d.laeq) + 10]);

    // create the x and y axes
    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .append("text")
      .attr("class", "axis-label")
      .attr("x", innerWidth / 2)
      .attr("y", margin.bottom)
      .style("text-anchor", "middle")
      .text("Time");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 15)
      .style("text-anchor", "middle")
      .text("dB");

    // draw the line on the chart 
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);
  };

  // redraw the chart when the selected monitor is changed in the dropdown and remove the tooltip div created
  useEffect(() => {
    console.log("effect triggered");
    fetchMonitorData();
    return () => {
      d3.select(".chart-container").selectAll(".tooltip").remove();
    };
  }, [selectedMonitor]);

  const handleMonitorChange = (event) => {
    setSelectedMonitor(event.target.value);
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
            <span>Measure Current Noise Levels at your Location</span>
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
          <div className="dropdown-container">
            <label htmlFor="monitorDropdown">Select Monitor: </label>
            <select
              id="monitorDropdown"
              value={selectedMonitor}
              onChange={handleMonitorChange}
            >
              {monitorInfo.map((monitor) => (
                <option
                  key={monitor.serial_number}
                  value={monitor.serial_number}
                >
                  {monitor.location}
                </option>
              ))}
            </select>
          </div>
          <div className="chart-container"></div>
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
