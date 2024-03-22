import axios from "axios";
import { Alert, Button, Label, TextInput } from "flowbite-react";
import "leaflet/dist/leaflet.css";
import React, { useContext, useEffect, useState } from "react";
import L from "leaflet";
import { UserContext, getErrorStr } from "..";
import Layout from "../Layout";
import {
  Link,
  createSearchParams,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import { FaBackward, FaMapMarkerAlt } from "react-icons/fa";
import ReactPlaceholder from "react-placeholder";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents
} from "react-leaflet";
import { Helmet } from "react-helmet";

const MyMarker = ({
  showPos,
  setShowPos,
  lat,
  setLat,
  lon,
  setLon,
  fly,
  updateFn
}) => {
  const icon = L.icon({
    iconSize: [25, 41],
    iconAnchor: [10, 41],
    popupAnchor: [2, -40],
    iconUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-shadow.png"
  });

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
    }
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
  const [alert, setAlert] = useState(null);

  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const [beacon, setBeacon] = useState(null);
  const [beaconEdit, setBeaconEdit] = useState(null);

  const [loading, setLoading] = useState(true);

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
        const properties = { ...data.properties }[data.properties.length - 1];
        delete beacon.properties;

        console.log("beacon", beacon);
        console.log("properties", properties);

        setBeacon(beacon);
        setBeaconEdit(properties);

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
          "Errore nel caricamento del beacon: " + err?.response?.data?.err
        );
        navigate("/beacon");
      } finally {
        setLoading(false);
      }
    }
    getBeacon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const { user } = useContext(UserContext);
  const isEditing = !!id; // true if id is not null (i.e. we are editing a beacon)
  const canEdit = user?.isAdmin || user?._id === beaconEdit?.editAuthor;

  useEffect(() => {
    if (user === null)
      return navigate({
        pathname: "/login",
        search: createSearchParams({
          to: "/beacon/editor" + (id ? `?id=${id}` : "")
        }).toString()
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const [disabled, setDisabled] = useState(!canEdit);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!lat || !lon || !isPositionSet) {
      setAlert({
        color: "failure",
        msg: "Seleziona la posizione del beacon sulla mappa"
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
        lon
      };
      // let res;
      if (isEditing) {
        console.log("data", data);
        // res =
        await axios.put(`/api/beacon/${beacon._id}`, data);
      } else {
        // res =
        await axios.post("/api/beacon", data);
      }
      // navigate(`/beacon/${res.data._id}`);
      // TODO debug
      navigate(`/beacon`);
    } catch (err) {
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    } finally {
      setDisabled(false);
    }
  }

  const [forceFly, setForceFly] = useState(false);

  useEffect(() => {
    // || !locator || locator.length !== 6
    if (isPositionSet || isLocatorFocused) return;

    console.log("fetching lat lon, len is", locator.length);

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
      position => {
        setLat(position.coords.latitude);
        setLon(position.coords.longitude);
        setIsPositionSet(true);
        setLocator("");
      },
      err => {
        console.log("Errore nella geolocalizzazione", err);
        setAlert({
          color: "failure",
          msg: "Errore nella geolocalizzazione"
        });
      }
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>
          {isEditing ? "Modifica" : "Nuovo"} beacon - VHF e superiori
        </title>
      </Helmet>
      <div className="w-full h-full pb-4 dark:text-white dark:bg-gray-900 -mt-4">
        <div className="mx-auto px-4 w-full md:w-5/6 py-12">
          <div className="mb-4 md:-ml-4 md:-mt-4">
            <Link to={disabled ? "#" : "/beacon"}>
              <Button color="info" disabled={disabled}>
                <FaBackward />
              </Button>
            </Link>
          </div>

          {alert && (
            <Alert
              className="mb-6"
              color={alert.color}
              onDismiss={() => setAlert(null)}
            >
              <span>{alert.msg}</span>
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
                {isEditing ? "Modifica" : "Nuovo"} Beacon{" "}
                {isEditing && callsign}
              </h1>
              {!isEditing && (
                <div className="mb-4">
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="callsign" value="Nominativo" />
                    </div>
                    <TextInput
                      type="text"
                      id="callsign"
                      name="callsign"
                      label="Nominativo"
                      minLength={1}
                      maxLength={10}
                      value={callsign}
                      onChange={e => setCallsign(e.target.value.toUpperCase())}
                      disabled={disabled}
                      autoComplete="callsign"
                      autoFocus
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4">
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="name" value="Nome" />
                  </div>
                  <TextInput
                    id="name"
                    type="text"
                    placeholder="Beacon"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="event-band" value="Frequenza in MHz" />
                  </div>
                  <TextInput
                    id="frequency"
                    type="text"
                    placeholder="144.000"
                    required
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="qthStr" value="QTH" />
                  </div>
                  <TextInput
                    id="qthStr"
                    type="text"
                    placeholder="Roma"
                    required
                    value={qthStr}
                    onChange={e => setQthStr(e.target.value)}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="locator" value="Locatore" />
                  </div>
                  <TextInput
                    id="locator"
                    type="text"
                    placeholder="JN61"
                    required
                    value={locator}
                    onChange={e => setLocator(e.target.value)}
                    disabled={disabled}
                    onFocus={() => setIsLocatorFocused(true)}
                    onBlur={() => setIsLocatorFocused(false)}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label
                      htmlFor="hamsl"
                      value="Altezza dal livello del mare"
                    />
                  </div>
                  <TextInput
                    id="hamsl"
                    type="number"
                    placeholder="100"
                    required
                    value={hamsl}
                    onChange={e => setHamsl(e.target.value)}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="antenna" value="Antenna" />
                  </div>
                  <TextInput
                    id="antenna"
                    type="text"
                    placeholder="Yagi"
                    required
                    value={antenna}
                    onChange={e => setAntenna(e.target.value)}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="mode" value="Modo" />
                  </div>
                  <TextInput
                    id="mode"
                    type="text"
                    placeholder="CW"
                    required
                    value={mode}
                    onChange={e => setMode(e.target.value)}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="qtf" value="QTF" />
                  </div>
                  <TextInput
                    id="qtf"
                    type="text"
                    placeholder="0"
                    required
                    value={qtf}
                    onChange={e => setQtf(e.target.value)}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="power" value="Potenza in Watt" />
                  </div>
                  <TextInput
                    id="power"
                    type="number"
                    placeholder="5"
                    required
                    value={power}
                    onChange={e => setPower(e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="flex flex-col w-full items-center mt-8">
                <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-8 items-center mb-2">
                  <div>
                    <h2 className="text-2xl font-bold">Posizione</h2>
                    <span className="text-gray-600 ">
                      Clicca sulla mappa per selezionare la posizione del beacon
                    </span>
                  </div>
                  <Button
                    color="info"
                    onClick={geolocalize}
                    disabled={disabled}
                  >
                    <FaMapMarkerAlt className="text-lg" />
                    Geolocalizza
                  </Button>
                </div>
                <div className="drop-shadow-lg flex justify-center">
                  <MapContainer center={[lat, lon]} zoom={13}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MyMarker
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
                  </MapContainer>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-2 items-center">
                <Link to="/beacon">
                  <Button
                    type="submit"
                    color="light"
                    disabled={disabled}
                    className="w-full"
                  >
                    Annulla
                  </Button>
                </Link>
                <div>
                  <Button
                    type="submit"
                    color="info"
                    size="lg"
                    disabled={disabled}
                    className="w-full"
                  >
                    {isEditing ? "Salva" : "Crea"}
                  </Button>
                </div>
              </div>
            </form>
          </ReactPlaceholder>
        </div>
      </div>
    </Layout>
  );
};

export default BeaconEditor;
