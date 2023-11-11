function fetchDataFromAPI() {
  const corsProxyUrl = "https://cors-anywhere.herokuapp.com/";
  const baseUrl =
    "https://data.smartdublin.ie/sonitus-api/api/data?username=dublincityapi&password=Xpa5vAQ9ki&monitor=01550&start=";

  // get the current time
  const currentTimestamp = Date.now();
  // get the most recent hour's worth of data
  const fiveMinutesAgo = currentTimestamp - 60 * 60 * 1000;
  const unixStartDate = Math.floor(fiveMinutesAgo / 300000) * 300;
  const unixEndDate = Math.floor(currentTimestamp / 300000) * 300;
  // create a base64-encoded credentials string
  const url = baseUrl + unixStartDate + "&end=" + unixEndDate;
  // return a promise that fetches and parses the data using the CORS proxy
  return fetch(corsProxyUrl + url, {
    method: "POST",
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  });
}

// Export the function
export { fetchDataFromAPI };
