import L from "leaflet";
import PropTypes from "prop-types";
import { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";

const StationMapMarker = ({
  iconRescaleFactor,
  callsign,
  lat,
  lon,
  locator,
  icon,
}) => {
  const _icon = useMemo(() => {
    return (
      icon ||
      L.icon({
        iconSize: [25, 41].map((e) => e * (iconRescaleFactor || 1)),
        iconAnchor: [10, 41].map((e) => e * (iconRescaleFactor || 1)),
        popupAnchor: [2, -40].map((e) => e * (iconRescaleFactor || 1)),
        iconUrl: "/mapicon/marker-icon.png",
        shadowUrl: "/mapicon/marker-shadow.png",
        shadowSize: iconRescaleFactor ? 0 : undefined,
      })
    );
  }, [icon, iconRescaleFactor]);

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
          {locator || `${lat?.toFixed(5)}, ${lon?.toFixed(5)}`}
        </p>
      </Popup>
    </Marker>
  );
};

StationMapMarker.propTypes = {
  iconRescaleFactor: PropTypes.number,
  callsign: PropTypes.string.isRequired,
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  locator: PropTypes.string,
  icon: PropTypes.object,
};

StationMapMarker.displayName = "StationMapMarker";

export default StationMapMarker;
