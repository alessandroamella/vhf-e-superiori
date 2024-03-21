import axios from "axios";
import { Alert, Button, Table, Tooltip } from "flowbite-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import React, { useContext, useEffect, useState } from "react";
import { UserContext, getErrorStr } from "..";
import Layout from "../Layout";
import { Link, createSearchParams, useNavigate } from "react-router-dom";
import ReactPlaceholder from "react-placeholder";
import { Card } from "@material-tailwind/react";
import { FaPen, FaPlus, FaTrash } from "react-icons/fa";

const BeaconHomepage = () => {
  const [alert, setAlert] = useState(null);
  const [beacons, setBeacons] = useState(null);
  const [loading, setLoading] = useState(true);

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

  async function deleteBeacon(id) {
    const confirm = window.confirm(
      "Sei sicuro di voler eliminare questo beacon?"
    );
    if (!confirm) return;

    try {
      await axios.delete(`/api/beacon/${id}`);
      setBeacons(beacons.filter(beacon => beacon._id !== id));
      setAlert({
        color: "success",
        msg: "Beacon eliminato con successo"
      });
    } catch (err) {
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    }
  }

  return (
    <Layout>
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
                      <Table.HeadCell>Nome</Table.HeadCell>
                      <Table.HeadCell>Frequenza</Table.HeadCell>
                      <Table.HeadCell>QTH</Table.HeadCell>
                      <Table.HeadCell>Locatore</Table.HeadCell>
                      <Table.HeadCell>HAMSL</Table.HeadCell>
                      <Table.HeadCell>Antenna</Table.HeadCell>
                      <Table.HeadCell>Modo</Table.HeadCell>
                      <Table.HeadCell>QTF</Table.HeadCell>
                      <Table.HeadCell>Potenza</Table.HeadCell>
                      <Table.HeadCell>
                        <span className="sr-only">Azioni</span>
                      </Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                      {beacons?.map(beacon => (
                        <Table.Row key={beacon.id}>
                          <Table.Cell>
                            <strong>{beacon.callsign}</strong>
                          </Table.Cell>
                          <Table.Cell>{beacon.properties?.name}</Table.Cell>
                          <Table.Cell>
                            {beacon.properties?.frequency} MHz
                          </Table.Cell>
                          <Table.Cell>{beacon.properties?.qthStr}</Table.Cell>
                          <Table.Cell>{beacon.properties?.locator}</Table.Cell>
                          <Table.Cell>{beacon.properties?.hamsl}m</Table.Cell>
                          <Table.Cell>{beacon.properties?.antenna}</Table.Cell>
                          <Table.Cell>{beacon.properties?.mode}</Table.Cell>
                          <Table.Cell>{beacon.properties?.qtf}</Table.Cell>
                          <Table.Cell>{beacon.properties?.power}W</Table.Cell>
                          <Table.Cell>
                            <div className="flex flex-row gap-1">
                              <Link to={`/beacon/editor?id=${beacon._id}`}>
                                <Button color="light">
                                  <FaPen />
                                </Button>
                              </Link>
                              {user?.isAdmin && (
                                <Tooltip content="Vedi questo in quanto amministratore">
                                  <Button
                                    color="failure"
                                    onClick={() => deleteBeacon(beacon._id)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </Tooltip>
                              )}
                            </div>
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
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BeaconHomepage;
