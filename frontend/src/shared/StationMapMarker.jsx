import React, { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
// import { Link } from "react-router-dom";

const StationMapMarker = ({ createUrl, callsign, lat, lon, locator, icon }) => {
  const _icon = useMemo(() => {
    return (
      icon ||
      L.icon({
        iconSize: [25, 41],
        iconAnchor: [10, 41],
        popupAnchor: [2, -40],
        iconUrl: "/mapicon/marker-icon.png",
        shadowUrl: "/mapicon/marker-shadow.png"
      })
    );
  }, [icon]);

  return (
    <Marker position={[lat, lon]} icon={_icon}>
      <Popup>
        {/* {createUrl ? (
          <Link
            to={"/u/" + callsign}
            className="text-center font-semibold block"
          >
            {callsign}
          </Link>
        ) : ( */}
        <h3 className="text-center font-semibold block">{callsign}</h3>
        {/* )} */}
        <p className="my-0 text-gray-500">
          {locator || lat?.toFixed(5) + ", " + lon?.toFixed(5)}
        </p>
      </Popup>
    </Marker>
  );
};

export default StationMapMarker;
