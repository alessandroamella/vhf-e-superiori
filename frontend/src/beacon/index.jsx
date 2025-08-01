import { Card, Typography } from "@material-tailwind/react";
import axios from "axios";
import { Alert, Button, Table } from "flowbite-react";
import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { FaPlus } from "react-icons/fa";
import ReactPlaceholder from "react-placeholder";
import { createSearchParams, Link, useNavigate } from "react-router";
import { UserContext } from "../App";
import { getErrorStr } from "../shared";
import { inRange } from "../shared/inRange";

const BeaconHomepage = () => {
  const [alert, setAlert] = useState(null);
  const [beacons, setBeacons] = useState(null);
  const [loading, setLoading] = useState(true);

  const [bands, setBands] = useState([]);

  const { user } = useContext(UserContext);

  useEffect(() => {
    async function getBeacons() {
      try {
        const { data } = await axios.get("/api/beacon");
        setBeacons(data);
        console.log("beacons", data);

        const bands = new Set();
        data
          .filter((beacon) => beacon.properties?.frequency)
          .forEach((beacon) => {
            let band = Math.floor(beacon.properties.frequency);
            if (band === 1297) {
              // doesnt exist
              band = 1296;
            }
            bands.add(band);
          });
        setBands(Array.from(bands).sort((a, b) => a - b));
      } catch (err) {
        console.log("Errore nel caricamento dei beacon", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err),
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
    <>
      <Helmet>
        <title>Beacon - VHF e superiori</title>
      </Helmet>
      <div className="w-full overflow-y-auto h-full pb-4 dark:text-white dark:bg-gray-900">
        <div className="mx-auto px-4 w-full md:w-11/12 py-12">
          {alert && (
            <Alert
              className="mb-6 dark:text-black"
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
                              to: "/beacon/editor",
                            }).toString(),
                          })
                    }
                  >
                    <FaPlus className="inline mr-2 mt-[2.5px]" />
                    Aggiungi beacon
                  </Button>
                </div>
              </ReactPlaceholder>
            }
            {bands.map((band) => (
              <div key={band} className="mt-4">
                <ReactPlaceholder
                  showLoadingAnimation
                  type="text"
                  rows={3}
                  ready={!loading}
                >
                  <Typography variant="h2" className="dark:text-white mb-4">
                    Banda {band} MHz
                  </Typography>
                  {Array.isArray(beacons) && beacons.length !== 0 ? (
                    <Table striped className="text-lg font-semibold">
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
                        {beacons
                          ?.filter(
                            (beacon) =>
                              beacon.properties?.frequency &&
                              inRange(
                                Math.floor(beacon.properties.frequency),
                                band - 1,
                                band + 1,
                              ),
                          )
                          ?.sort(
                            (a, b) =>
                              a.properties?.frequency - b.properties?.frequency,
                          )
                          ?.map((beacon) => (
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
                              <Table.Cell>
                                {beacon.properties?.locator}
                              </Table.Cell>
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
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default BeaconHomepage;
