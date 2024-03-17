import axios from "axios";
import { Alert, Button, Label, TextInput } from "flowbite-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import React, { useContext, useEffect, useState } from "react";
import { UserContext, getErrorStr } from "..";
import Layout from "../Layout";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaBackward } from "react-icons/fa";
import ReactPlaceholder from "react-placeholder";

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
        const properties = { ...data.properties }[0];
        delete beacon.properties;

        console.log("beacon", beacon);
        console.log("properties", properties);

        setBeacon(beacon);
        setBeaconEdit(properties);

        setCallsign(beacon.callsign);

        setFrequency(properties.frequency);
        setQthStr(properties.qthStr);
        setLocator(properties.locator);
        setHamsl(properties.hamsl);
        setAntenna(properties.antenna);
        setMode(properties.mode);
        setQtf(properties.qtf);
        setPower(properties.power);
      } catch (err) {
        console.log("Errore nel caricamento del beacon", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
      } finally {
        setLoading(false);
      }
    }
    getBeacon();
  }, [id]);

  const { user } = useContext(UserContext);
  const isEditing = !!id; // true if id is not null (i.e. we are editing a beacon)
  const canEdit = user?.isAdmin || user?._id === beaconEdit?.editAuthor;

  // callsign
  const [callsign, setCallsign] = useState("");

  // frequency, qthStr, locator, hamsl, antenna, mode, qtf, power
  const [frequency, setFrequency] = useState("");
  const [qthStr, setQthStr] = useState("");
  const [locator, setLocator] = useState("");
  const [hamsl, setHamsl] = useState("");
  const [antenna, setAntenna] = useState("");
  const [mode, setMode] = useState("");
  const [qtf, setQtf] = useState("");
  const [power, setPower] = useState("");

  const [disabled, setDisabled] = useState(!canEdit);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setAlert(null);

    try {
      setDisabled(true);
      const data = {
        callsign,
        frequency,
        qthStr,
        locator,
        hamsl,
        antenna,
        mode,
        qtf,
        power
      };
      let res;
      if (isEditing) {
        res = await axios.put(`/api/beacon/${beacon._id}`, data);
      } else {
        res = await axios.post("/api/beacon", data);
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

  return (
    <Layout>
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
                    <Label htmlFor="event-band" value="Frequenza in MHz" />
                  </div>
                  <TextInput
                    id="frequency"
                    type="text"
                    placeholder="144.000"
                    required={true}
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
                    required={true}
                    value={qthStr}
                    onChange={e => setQthStr(e.target.value)}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="locator" value="Locator" />
                  </div>
                  <TextInput
                    id="locator"
                    type="text"
                    placeholder="JN61"
                    required={true}
                    value={locator}
                    onChange={e => setLocator(e.target.value)}
                    disabled={disabled}
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
                    required={true}
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
                    required={true}
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
                    required={true}
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
                    required={true}
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
                    placeholder="10"
                    required={true}
                    value={power}
                    onChange={e => setPower(e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-center">
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
