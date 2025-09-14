import ReactGA from "react-ga4";

const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (!gaMeasurementId) {
  console.error("GA_MEASUREMENT_ID not set");
}

ReactGA.initialize(gaMeasurementId);
console.log("GA4 initialized");
