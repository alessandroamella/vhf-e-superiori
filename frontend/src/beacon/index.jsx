import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Alert, Button, Table } from "flowbite-react";
import { UserContext, getErrorStr } from "..";
import Layout from "../Layout";
import { Link, createSearchParams, useNavigate } from "react-router-dom";
import ReactPlaceholder from "react-placeholder";
import { Card } from "@material-tailwind/react";
import { FaPlus } from "react-icons/fa";
import { Helmet } from "react-helmet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

const BeaconHomepage = () => {
  const [alert, setAlert] = useState(null);
  const [beacons, setBeacons] = useState(null);
  const [loading, setLoading] = useState(true);

  const meanLatLon = useMemo(() => {
    if (!Array.isArray(beacons)) return null;
    // filter beacons with lat and lon
    const _beacons = beacons.filter(
      beacon =>
        typeof beacon.properties.lat === "number" &&
        typeof beacon.properties.lon === "number"
    );
    if (_beacons.length === 0) return null;
    const meanLat =
      _beacons.reduce((acc, beacon) => acc + beacon.properties.lat, 0) /
      _beacons.length;
    const meanLon =
      _beacons.reduce((acc, beacon) => acc + beacon.properties.lon, 0) /
      _beacons.length;
    if (isNaN(meanLat) || isNaN(meanLon)) {
      console.error("meanLat or meanLon is NaN", meanLat, meanLon);
      return null;
    }
    return [meanLat, meanLon];
  }, [beacons]);
  const icon = useMemo(
    () =>
      L.icon({
        iconSize: [25, 41],
        iconAnchor: [10, 41],
        popupAnchor: [2, -40],
        iconUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-shadow.png"
      }),
    []
  );

  const { user } = useContext(UserContext);

  useEffect(() => {
    async function getBeacons() {
      try {
        const { data } = await axios.get("/api/beacon");
        setBeacons(data);
        console.log("beacons", data);
      } catch (err) {
        console.log("Errore nel caricamento dei beacon", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
        setBeacons(null);
      } finally {
        setLoading(false);
      }
    }
    getBeacons();
  }, []);

  const navigate = useNavigate();

  return (
    <Layout>
      <Helmet>
        <title>Beacon - VHF e superiori</title>
      </Helmet>
      <div className="w-full h-full pb-4 dark:text-white dark:bg-gray-900 -mt-4">
        <div className="mx-auto px-4 w-full md:w-11/12 py-12">
          {alert && (
            <Alert
              className="mb-6"
              color={alert.color}
              onDismiss={() => setAlert(null)}
            >
              <span>{alert.msg}</span>
            </Alert>
          )}

          <div className="flex flex-col gap-8">
            {
              <ReactPlaceholder
                showLoadingAnimation
                type="textRow"
                rows={1}
                ready={user !== false}
              >
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <Button
                    onClick={() =>
                      user
                        ? navigate("/beacon/editor")
                        : navigate({
                            pathname: "/login",
                            search: createSearchParams({
                              to: "/beacon/editor"
                            }).toString()
                          })
                    }
                  >
                    <FaPlus className="inline mr-2" />
                    Aggiungi beacon
                  </Button>
                </div>
              </ReactPlaceholder>
            }
            <div>
              <ReactPlaceholder
                showLoadingAnimation
                type="text"
                rows={3}
                ready={!loading}
              >
                {Array.isArray(beacons) && beacons.length !== 0 ? (
                  <Table striped>
                    <Table.Head>
                      <Table.HeadCell>Nominativo</Table.HeadCell>
                      <Table.HeadCell className="hidden md:table-cell">
                        Nome
                      </Table.HeadCell>
                      <Table.HeadCell>Frequenza</Table.HeadCell>
                      <Table.HeadCell className="hidden md:table-cell">
                        QTH
                      </Table.HeadCell>
                      <Table.HeadCell>Locatore</Table.HeadCell>
                      <Table.HeadCell className="hidden md:table-cell">
                        HAMSL
                      </Table.HeadCell>
                      <Table.HeadCell className="hidden md:table-cell">
                        Antenna
                      </Table.HeadCell>
                      <Table.HeadCell className="hidden md:table-cell">
                        Modo
                      </Table.HeadCell>
                      <Table.HeadCell className="hidden md:table-cell">
                        QTF
                      </Table.HeadCell>
                      <Table.HeadCell className="hidden md:table-cell">
                        Potenza
                      </Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                      {beacons?.map(beacon => (
                        <Table.Row
                          className="cursor-pointer transition-all hover:bg-gray-100"
                          key={beacon._id}
                          onClick={() => navigate(`/beacon/${beacon._id}`)}
                        >
                          <Table.Cell>
                            <Link
                              className="font-bold"
                              to={`/beacon/${beacon._id}`}
                            >
                              {beacon.callsign}
                            </Link>
                          </Table.Cell>
                          <Table.Cell className="hidden md:table-cell">
                            {beacon.properties?.name}
                          </Table.Cell>
                          <Table.Cell>
                            {beacon.properties?.frequency?.toFixed(3)}
                          </Table.Cell>
                          <Table.Cell className="hidden md:table-cell">
                            {beacon.properties?.qthStr}
                          </Table.Cell>
                          <Table.Cell>{beacon.properties?.locator}</Table.Cell>
                          <Table.Cell className="hidden md:table-cell">
                            {beacon.properties?.hamsl}m
                          </Table.Cell>
                          <Table.Cell className="hidden md:table-cell">
                            {beacon.properties?.antenna}
                          </Table.Cell>
                          <Table.Cell className="hidden md:table-cell">
                            {beacon.properties?.mode}
                          </Table.Cell>
                          <Table.Cell className="hidden md:table-cell">
                            {beacon.properties?.qtf}
                          </Table.Cell>
                          <Table.Cell className="hidden md:table-cell">
                            {beacon.properties?.power}W
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                ) : (
                  <Card>
                    <Card.Body>
                      {alert?.color === "failure" ? (
                        <p>Errore nel caricamento dei beacon: {alert.msg}</p>
                      ) : (
                        <p>Nessun beacon presente</p>
                      )}
                    </Card.Body>
                  </Card>
                )}
              </ReactPlaceholder>
            </div>
            {meanLatLon && (
              <div className="flex justify-center w-full">
                <MapContainer center={meanLatLon} zoom={5}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {beacons
                    ?.filter(
                      beacon =>
                        typeof beacon.properties.lat === "number" &&
                        typeof beacon.properties.lon === "number"
                    )
                    .map(beacon => (
                      <Marker
                        key={beacon._id}
                        position={[
                          beacon.properties.lat,
                          beacon.properties.lon
                        ]}
                        icon={icon}
                      >
                        <Popup>
                          <Link
                            className="text-center"
                            to={`/beacon/${beacon._id}`}
                          >
                            {beacon.callsign}
                          </Link>
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BeaconHomepage;
