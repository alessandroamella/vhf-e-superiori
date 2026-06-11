import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Alert, Button } from "flowbite-react";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { FaBackward } from "react-icons/fa";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import ReactPlaceholder from "react-placeholder";
import { Link } from "react-router";
import { getErrorStr } from "../shared";
import MapWatermark from "../shared/MapWatermark";

// Fit the map viewport around all beacon markers.
const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (!positions.length) return;
    if (positions.length === 1) {
      map.setView(positions[0], 9);
      return;
    }
    map.fitBounds(positions, { padding: [40, 40] });
  }, [map, positions]);
  return null;
};

const BeaconMap = () => {
  const { t } = useTranslation();

  const {
    data: beacons,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["beacons"],
    queryFn: async () => {
      const { data } = await axios.get("/api/beacon");
      return data;
    },
  });

  const alert = error
    ? { color: "failure", msg: getErrorStr(error?.response?.data?.err) }
    : null;

  const icon = useMemo(
    () =>
      L.icon({
        iconSize: [25, 41],
        iconAnchor: [10, 41],
        popupAnchor: [2, -40],
        iconUrl: "/mapicon/marker-icon.png",
        shadowUrl: "/mapicon/marker-shadow.png",
      }),
    [],
  );

  const mapped = useMemo(
    () =>
      Array.isArray(beacons)
        ? beacons.filter(
            (b) =>
              typeof b.properties?.lat === "number" &&
              typeof b.properties?.lon === "number",
          )
        : [],
    [beacons],
  );

  const positions = useMemo(
    () => mapped.map((b) => [b.properties.lat, b.properties.lon]),
    [mapped],
  );

  return (
    <>
      <Helmet>
        <title>{t("beacons.map.pageTitle")} - VHF e Superiori</title>
      </Helmet>
      <div className="w-full min-h-[60vh] h-full pb-4 dark:text-white bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="mx-auto px-4 w-full md:w-11/12 py-12">
          <div className="mb-4 md:-ml-4 md:-mt-4">
            <Link to="/beacon">
              <Button color="gray" outline>
                <FaBackward />
              </Button>
            </Link>
          </div>

          <h1 className="text-3xl md:text-4xl text-center font-bold mb-6">
            {t("beacons.map.title")}
          </h1>

          {alert && (
            <Alert className="mb-6 dark:text-black" color={alert.color}>
              <span>{alert.msg}</span>
            </Alert>
          )}

          <ReactPlaceholder
            showLoadingAnimation
            type="rect"
            style={{ height: "60vh" }}
            ready={!loading}
          >
            {mapped.length === 0 ? (
              <p className="text-center">{t("beacons.map.empty")}</p>
            ) : (
              <div className="drop-shadow-lg flex justify-center relative">
                <MapContainer center={positions[0]} zoom={6}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    referrerPolicy="strict-origin-when-cross-origin"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  {mapped.map((b) => (
                    <Marker
                      key={b._id}
                      position={[b.properties.lat, b.properties.lon]}
                      icon={icon}
                    >
                      <Popup>
                        <div className="text-center">
                          <Link
                            className="font-bold text-base"
                            to={`/beacon/${b._id}`}
                          >
                            {b.callsign}
                          </Link>
                          <p className="m-0 p-0">
                            {b.properties.frequency?.toFixed(3)} MHz
                          </p>
                          <p className="m-0 p-0">{b.properties.locator}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  <FitBounds positions={positions} />
                  <MapWatermark />
                </MapContainer>
              </div>
            )}
          </ReactPlaceholder>
        </div>
      </div>
    </>
  );
};

export default BeaconMap;
