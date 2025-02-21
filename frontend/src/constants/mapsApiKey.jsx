export const mapsApiKey = import.meta.env.VITE_MAPS_API_KEY;
if (!mapsApiKey) {
  console.error("Missing VITE_MAPS_API_KEY env");
} else {
  console.log("Using mapsApiKey:", mapsApiKey);
}
