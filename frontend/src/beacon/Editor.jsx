import axios from "axios";
import { Alert, Button, Label, TextInput } from "flowbite-react";
import L from "leaflet";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import ReactGA from "react-ga4";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { FaBackward, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import ReactPlaceholder from "react-placeholder";
import {
  createSearchParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router";
import { getErrorStr } from "../shared";
import MapWatermark from "../shared/MapWatermark";
import useUserStore from "../stores/userStore";

const CustomMarker = ({
  showPos,
  setShowPos,
  lat,
  setLat,
  lon,
  setLon,
  fly,
  updateFn,
}) => {
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

  const map = useMapEvents({
    // on load, locate
    click(e) {
      console.log("latlng", e.latlng);
      const { lat, lng } = e.latlng;
      setLat(lat);
      setLon(lng);
      setShowPos(true);

      updateFn();

      // map.locate({ setView: true });
      // const { lat, lng } = e.latlng;
      // L.marker([lat, lng], { icon }).addTo(map);
    },
  });

  if (fly) map.flyTo([lat, lon], map.getZoom());

  return (
    showPos && (
      <Marker position={[lat, lon]} icon={icon}>
        <Popup>
          Posizione del beacon: {lat.toFixed(6)}, {lon.toFixed(6)}
        </Popup>
      </Marker>
    )
  );
};

const BeaconEditor = () => {
  const { t } = useTranslation();
  const [alert, setAlert] = useState(null);

  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const [beacon, setBeacon] = useState(null);

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      // if id is null, we are creating a new beacon
      setLoading(false);
      return;
    }

    async function getBeacon() {
      try {
        const { data } = await axios.get(`/api/beacon/${id}`);

        const beacon = { ...data };
        const properties = data.properties;
        delete beacon.properties;

        console.log("beacon", beacon);
        console.log("properties", properties);

        setBeacon(beacon);

        setOwnerId(beacon.owner?._id || beacon.owner || "");
        setOwnerQuery(beacon.owner?.callsign || "");

        setCallsign(beacon.callsign);

        setName(properties.name);
        setFrequency(properties.frequency);
        setQthStr(properties.qthStr);
        setLocator(properties.locator);
        setHamsl(properties.hamsl);
        setAntenna(properties.antenna);
        setMode(properties.mode);
        setQtf(properties.qtf);
        setPower(properties.power);

        if (properties.lat && properties.lon) {
          setLat(parseFloat(properties.lat));
          setLon(parseFloat(properties.lon));
          setIsPositionSet(true);
        }
      } catch (err) {
        console.log("Errore nel caricamento del beacon", err);
        // setAlert({
        //   color: "failure",
        //   msg: getErrorStr(err?.response?.data?.err)
        // });
        window.alert(
          `Errore nel caricamento del beacon: ${err?.response?.data?.err}`,
        );
        navigate("/beacon");
      } finally {
        setLoading(false);
      }
    }
    getBeacon();
  }, [id, navigate]);

  const user = useUserStore((store) => store.user);
  const isEditing = !!id; // true if id is not null (i.e. we are editing a beacon)

  // any logged in user can create a new beacon; editing an existing one is
  // restricted to its maintainer (owner) or an admin
  const canEdit = useMemo(() => {
    if (!isEditing) return true;
    if (!beacon || !user) return false;
    if (user.isAdmin) return true;
    const ownerId = beacon.owner?._id || beacon.owner;
    return !!ownerId && ownerId === user._id;
  }, [isEditing, beacon, user]);

  useEffect(() => {
    if (user === null)
      navigate({
        pathname: "/login",
        search: createSearchParams({
          to: `/beacon/editor${id ? `?id=${id}` : ""}`,
        }).toString(),
      });
  }, [user, id, navigate]);

  // callsign
  const [callsign, setCallsign] = useState("");

  // name, frequency, qthStr, locator, hamsl, antenna, mode, qtf, power
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("");
  const [qthStr, setQthStr] = useState("");
  const [locator, setLocator] = useState("");
  const [hamsl, setHamsl] = useState("");
  const [antenna, setAntenna] = useState("");
  const [mode, setMode] = useState("");
  const [qtf, setQtf] = useState("");
  const [power, setPower] = useState("");
  const [lat, setLat] = useState(44.646331832036864);
  const [lon, setLon] = useState(10.925526003071043);

  const [isPositionSet, setIsPositionSet] = useState(false);
  const [isLocatorFocused, setIsLocatorFocused] = useState(false);

  const [disabled, setDisabled] = useState(false);

  // owner (maintainer) reassignment — admins only
  const [users, setUsers] = useState([]);
  const [ownerId, setOwnerId] = useState("");
  const [ownerQuery, setOwnerQuery] = useState("");
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) return;
    async function getUsers() {
      try {
        const { data } = await axios.get("/api/auth/all", {
          params: { sortByCallsign: true },
        });
        setUsers(data);
      } catch (err) {
        console.log("Errore nel caricamento degli utenti", err);
      }
    }
    getUsers();
  }, [user?.isAdmin]);

  const ownerMatches = useMemo(() => {
    const q = ownerQuery.trim().toLowerCase();
    if (!q) return users.slice(0, 8);
    return users
      .filter(
        (u) =>
          u.callsign?.toLowerCase().includes(q) ||
          u.name?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [users, ownerQuery]);

  const formDisabled = disabled || !canEdit;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!lat || !lon || !isPositionSet) {
      setAlert({
        color: "failure",
        msg: t("beaconEditor.validation.positionRequired"),
      });
      window.scrollTo(0, 0);
      return;
    }

    // admins editing must keep a maintainer (owner is mandatory)
    if (isEditing && user?.isAdmin && !ownerId) {
      setAlert({
        color: "failure",
        msg: t("beaconEditor.validation.ownerRequired"),
      });
      window.scrollTo(0, 0);
      return;
    }

    setAlert(null);

    try {
      setDisabled(true);
      const data = {
        callsign,
        name,
        frequency,
        qthStr,
        locator,
        hamsl,
        antenna,
        mode,
        qtf,
        power,
        lat,
        lon,
      };
      // admins can reassign the maintainer (owner) when editing
      if (isEditing && user?.isAdmin) {
        data.owner = ownerId;
      }
      // let res;
      let _id;
      if (isEditing) {
        console.log("data", data);
        await axios.put(`/api/beacon/${beacon._id}`, data);
        _id = id;
      } else {
        const res = await axios.post("/api/beacon", data);
        _id = res.data._id;
      }
      ReactGA.event({
        category: "Beacon",
        action: isEditing ? "Edit Beacon" : "Create Beacon",
        label: callsign,
      });
      navigate(`/beacon/${_id}`, { replace: true });
    } catch (err) {
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setDisabled(false);
    }
  }

  const [forceFly, setForceFly] = useState(false);

  useEffect(() => {
    if (isPositionSet || isLocatorFocused || ![4, 6].includes(locator.length)) {
      console.log("not fetching lat lon for locator", {
        isPositionSet,
        isLocatorFocused,
        locator,
      });
      return;
    }

    console.log(
      "fetching lat lon for locator",
      locator,
      "len is",
      locator.length,
    );

    async function getLatLon() {
      setDisabled(true);
      try {
        const { data } = await axios.get(`/api/location/latlon/${locator}`);
        console.log("fetched lat lon", data);
        setLat(data.lat);
        setLon(data.lon);
        setIsPositionSet(true);
        setForceFly(true);
        setTimeout(() => setForceFly(false), 1000);
      } catch (err) {
        console.log("Errore nel caricamento della posizione", err);
      } finally {
        setDisabled(false);
      }
    }
    getLatLon();
  }, [locator, isPositionSet, isLocatorFocused]);

  useEffect(() => {
    if (
      !isPositionSet ||
      !lat ||
      !lon ||
      isLocatorFocused ||
      locator.length === 6
    )
      return;

    console.log("fetching locator, lat lon is ", lat, lon);

    async function getLocator() {
      setDisabled(true);
      try {
        const { data } = await axios.get(`/api/location/locator/${lat}/${lon}`);
        console.log("fetched locator", data);
        setLocator(data.locator);
        setIsPositionSet(true);
        setForceFly(true);
        setTimeout(() => setForceFly(false), 1000);
      } catch (err) {
        console.log("Errore nel caricamento del locator", err);
      } finally {
        setDisabled(false);
      }
    }
    getLocator();
  }, [lat, lon, isPositionSet, locator, isLocatorFocused]);

  function geolocalize() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLon(position.coords.longitude);
        setIsPositionSet(true);
        setLocator("");
      },
      (err) => {
        console.log("Errore nella geolocalizzazione", err);
        setAlert({
          color: "failure",
          msg: t("beaconEditor.alerts.geolocalizationError"),
        });
      },
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {t(
            isEditing
              ? "beaconEditor.pageTitle.edit"
              : "beaconEditor.pageTitle.new",
          )}{" "}
          - VHF e Superiori
        </title>
      </Helmet>
      <div className="w-full h-full pb-4 dark:text-white bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="mx-auto px-4 w-full md:w-5/6 py-12">
          <div className="mb-4 md:-ml-4 md:-mt-4">
            <Link to={disabled ? "#" : isEditing ? `/beacon/${id}` : "/beacon"}>
              <Button color="info" disabled={disabled}>
                <FaBackward />
              </Button>
            </Link>
          </div>

          {alert && (
            <Alert
              className="mb-6 dark:text-black"
              color={alert.color}
              onDismiss={() => setAlert(null)}
            >
              <span>{alert.msg}</span>
            </Alert>
          )}

          {!loading && isEditing && !canEdit && (
            <Alert className="mb-6 dark:text-black" color="warning">
              <span>{t("beaconEditor.alerts.cannotEdit")}</span>
            </Alert>
          )}

          <ReactPlaceholder
            showLoadingAnimation
            type="text"
            rows={5}
            ready={!loading}
          >
            <form onSubmit={handleSubmit}>
              <h1 className="text-4xl font-bold mb-4">
                {t(
                  isEditing
                    ? "beaconEditor.heading.edit"
                    : "beaconEditor.heading.new",
                )}{" "}
                Beacon {isEditing && callsign}
              </h1>
              {!isEditing && (
                <div className="mb-4">
                  <div>
                    <div className="mb-2 block">
                      <Label
                        htmlFor="username"
                        value={t("beaconEditor.form.callsign")}
                      />
                    </div>
                    <TextInput
                      type="text"
                      id="username"
                      name="username"
                      label="Nominativo"
                      minLength={1}
                      maxLength={10}
                      value={callsign}
                      onChange={(e) =>
                        setCallsign(e.target.value.toUpperCase())
                      }
                      disabled={disabled}
                      autoComplete="username"
                      autoFocus
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4">
                <div>
                  <div className="mb-2 block">
                    <Label
                      htmlFor="event-band"
                      value={t("beaconEditor.form.frequency")}
                    />
                  </div>
                  <TextInput
                    id="frequency"
                    type="text"
                    placeholder="144.000"
                    required
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    disabled={formDisabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label
                      htmlFor="qthStr"
                      value={t("beaconEditor.form.qth")}
                    />
                  </div>
                  <TextInput
                    id="qthStr"
                    type="text"
                    placeholder="Roma"
                    required
                    value={qthStr}
                    onChange={(e) => setQthStr(e.target.value)}
                    disabled={formDisabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label
                      htmlFor="locator"
                      value={t("beaconEditor.form.locator")}
                    />
                  </div>
                  <TextInput
                    id="locator"
                    type="text"
                    placeholder="JN61"
                    required
                    value={locator}
                    onChange={(e) => setLocator(e.target.value)}
                    disabled={formDisabled}
                    onFocus={() => setIsLocatorFocused(true)}
                    onBlur={() => setIsLocatorFocused(false)}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label
                      htmlFor="hamsl"
                      value={t("beaconEditor.form.hamsl")}
                    />
                  </div>
                  <TextInput
                    id="hamsl"
                    type="number"
                    placeholder="100"
                    required
                    value={hamsl}
                    onChange={(e) => setHamsl(e.target.value)}
                    disabled={formDisabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label
                      htmlFor="antenna"
                      value={t("beaconEditor.form.antenna")}
                    />
                  </div>
                  <TextInput
                    id="antenna"
                    type="text"
                    placeholder="Yagi"
                    required
                    value={antenna}
                    onChange={(e) => setAntenna(e.target.value)}
                    disabled={formDisabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="mode" value={t("beaconEditor.form.mode")} />
                  </div>
                  <TextInput
                    id="mode"
                    type="text"
                    placeholder="CW"
                    required
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    disabled={formDisabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="qtf" value={t("beaconEditor.form.qtf")} />
                  </div>
                  <TextInput
                    id="qtf"
                    type="text"
                    placeholder="0"
                    required
                    value={qtf}
                    onChange={(e) => setQtf(e.target.value)}
                    disabled={formDisabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label
                      htmlFor="power"
                      value={t("beaconEditor.form.power")}
                    />
                  </div>
                  <TextInput
                    id="power"
                    type="number"
                    placeholder="5"
                    required
                    value={power}
                    onChange={(e) => setPower(e.target.value)}
                    disabled={formDisabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="name" value={t("beaconEditor.form.name")} />
                  </div>
                  <TextInput
                    id="name"
                    type="text"
                    placeholder={t("beaconEditor.form.namePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={formDisabled}
                  />
                </div>
              </div>

              {isEditing && user?.isAdmin && (
                <div className="mt-6 rounded-lg border border-gray-300 dark:border-gray-600 p-4 bg-white/60 dark:bg-gray-800/60">
                  <div className="mb-2 flex items-center gap-2">
                    <FaUser className="text-gray-500 dark:text-gray-400" />
                    <Label
                      htmlFor="owner"
                      value={t("beaconEditor.owner.label")}
                    />
                  </div>
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    {t("beaconEditor.owner.description")}
                  </p>
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <TextInput
                        id="owner"
                        className="grow"
                        type="text"
                        placeholder={t("beaconEditor.owner.placeholder")}
                        autoComplete="off"
                        value={ownerQuery}
                        onChange={(e) => {
                          setOwnerQuery(e.target.value);
                          setOwnerId("");
                          setShowOwnerDropdown(true);
                        }}
                        onFocus={() => setShowOwnerDropdown(true)}
                        onBlur={() =>
                          setTimeout(() => setShowOwnerDropdown(false), 150)
                        }
                      />
                    </div>
                    {showOwnerDropdown && ownerMatches.length > 0 && (
                      <ul className="absolute z-[1000] mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                        {ownerMatches.map((u) => (
                          <li key={u._id}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              onClick={() => {
                                setOwnerId(u._id);
                                setOwnerQuery(u.callsign);
                                setShowOwnerDropdown(false);
                              }}
                            >
                              <span className="font-bold">{u.callsign}</span>
                              {u.name && (
                                <span className="text-gray-500 dark:text-gray-400 text-sm">
                                  {u.name}
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <p className="mt-2 text-sm">
                    {ownerId ? (
                      <span className="text-green-700 dark:text-green-400">
                        {t("beaconEditor.owner.selected", {
                          callsign: ownerQuery,
                        })}
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        {t("beaconEditor.owner.required")}
                      </span>
                    )}
                  </p>
                </div>
              )}

              <hr className="my-6 bg-gray-500 dark:bg-gray-400" />

              <div className="flex flex-col w-full items-center mt-4">
                <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-8 items-center mb-2">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {t("beaconEditor.position.title")}
                    </h2>
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("beaconEditor.position.description")}
                    </span>
                  </div>
                  <Button
                    color="info"
                    onClick={geolocalize}
                    disabled={formDisabled}
                  >
                    <FaMapMarkerAlt className="text-lg" />
                    {t("beaconEditor.position.geolocalize")}
                  </Button>
                </div>
                <div className="drop-shadow-lg flex justify-center relative mt-2 w-full">
                  <MapContainer center={[lat, lon]} zoom={13}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      referrerPolicy="strict-origin-when-cross-origin"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <CustomMarker
                      lat={lat}
                      lon={lon}
                      showPos={isPositionSet}
                      setShowPos={setIsPositionSet}
                      setLat={setLat}
                      setLon={setLon}
                      fly={forceFly}
                      updateFn={() => {
                        console.log("update");
                        setLocator("");
                      }}
                    />

                    <MapWatermark />
                  </MapContainer>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-2 items-center">
                <Link to={isEditing ? `/beacon/${id}` : "/beacon"}>
                  <Button
                    type="submit"
                    color="light"
                    disabled={disabled}
                    className="w-full"
                  >
                    {t("beaconEditor.buttons.cancel")}
                  </Button>
                </Link>
                <div>
                  <Button
                    type="submit"
                    color="info"
                    size="lg"
                    disabled={formDisabled}
                    className="w-full"
                  >
                    {t(
                      isEditing
                        ? "beaconEditor.buttons.save"
                        : "beaconEditor.buttons.create",
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </ReactPlaceholder>
        </div>
      </div>
    </>
  );
};

CustomMarker.propTypes = {
  showPos: PropTypes.bool,
  setShowPos: PropTypes.func,
  lat: PropTypes.number,
  setLat: PropTypes.func,
  lon: PropTypes.number,
  setLon: PropTypes.func,
  fly: PropTypes.bool,
  updateFn: PropTypes.func,
};

CustomMarker.displayName = "CustomMarker";

export default BeaconEditor;
