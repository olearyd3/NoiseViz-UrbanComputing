import { promises as fsPromises } from "fs";

async function filterMonitors() {
  try {
    // read in info from all monitors
    const jsonData = JSON.parse(
      await fsPromises.readFile("monitorsAll.json", "utf-8"),
    );

    // filter to only have noise monitors with valid locations
    const filteredMonitors = jsonData.filter(
      (monitor) =>
        monitor.label.includes("Noise") &&
        monitor.latitude !== "" &&
        monitor.longitude !== "",
    );

    // write to monitorInfo.json
    await fsPromises.writeFile(
      "monitorInfo.json",
      JSON.stringify(filteredMonitors, null, 2),
    );

    console.log("Filtered data written to monitorsInfo.json");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

filterMonitors();
