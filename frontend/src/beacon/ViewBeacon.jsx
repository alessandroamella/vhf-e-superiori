import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Alert, Button, Card, Tooltip } from "flowbite-react";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { FaBackward, FaInfoCircle, FaPen, FaTrash } from "react-icons/fa";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import ReactPlaceholder from "react-placeholder";
import { Link, useNavigate, useParams } from "react-router";
import { getErrorStr } from "../shared";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import MapWatermark from "../shared/MapWatermark";
import useUserStore from "../stores/userStore";

const ViewBeacon = () => {
  const [alert, setAlert] = useState(null);

  const { t } = useTranslation();

  const { id } = useParams();

  const queryClient = useQueryClient();

  const {
    data: beacon,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["beacon", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/beacon/${id}`);
      console.log("beacon", data);
      return data;
    },
  });

  const properties = beacon?.properties || null;

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

  useEffect(() => {
    if (!error) return;
    console.log("Errore nel caricamento del beacon", error);
    setAlert({
      color: "failure",
      msg: getErrorStr(error?.response?.data?.err),
    });
  }, [error]);

  const user = useUserStore((store) => store.user);

  const navigate = useNavigate();

  const ownerCallsign = beacon?.owner || null;
  const canEdit =
    user?.isAdmin ||
    (!!ownerCallsign &&
      !!user?.callsign &&
      ownerCallsign.toUpperCase() === user.callsign.toUpperCase());

  async function deleteBeacon(id) {
    const confirm = window.confirm(
      t("beaconViewer.deleteConfirmation.single", { count: 1 }),
    );
    if (!confirm) return;

    try {
      await axios.delete(`/api/beacon/${id}`);
      queryClient.invalidateQueries({ queryKey: ["beacons"] });
      navigate("/beacon");
    } catch (err) {
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
    }
  }

  return (
    <>
      <Helmet>
        <title>
          {t("beaconViewer.pageTitle", { callsign: beacon?.callsign || "" })}
        </title>
      </Helmet>
      <div className="w-full h-full pb-4 dark:text-white bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="mx-auto px-4 w-full md:w-5/6 py-12">
          <div className="mb-4 md:-ml-4 md:-mt-4">
            <Link to={"/beacon"}>
              <Button color="gray" outline>
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

          <ReactPlaceholder
            showLoadingAnimation
            type="text"
            rows={3}
            ready={!loading}
          >
            {beacon && properties && (
              <>
                <h1 className="text-3xl md:text-4xl text-center font-bold mb-1">
                  {t("beaconViewer.header", { callsign: beacon.callsign })}
                </h1>
                {properties.name && (
                  <p className="text-center text-lg text-gray-500 dark:text-gray-400 mb-4">
                    {properties.name}
                  </p>
                )}

                <div className="flex flex-col md:flex-row md:justify-between mb-4">
                  <div className="flex gap-1">
                    {canEdit && (
                      <Link to={`/beacon/editor?id=${beacon._id}`}>
                        <Button color="light">
                          <FaPen className="inline mr-2" />
                          {t("beaconViewer.editButton")}
                        </Button>
                      </Link>
                    )}
                    {user?.isAdmin && (
                      <Tooltip content={t("beaconViewer.adminTooltip")}>
                        <Button
                          color="failure"
                          onClick={() => deleteBeacon(beacon._id)}
                        >
                          <FaTrash className="inline mr-2" />
                          {t("beaconViewer.deleteBeaconButton")}
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </div>

                <Card className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p>
                        <strong>{t("beaconViewer.callsignLabel")}:</strong>{" "}
                        {beacon.callsign}
                      </p>
                      {properties.name && (
                        <p>
                          <strong>{t("beaconViewer.nameLabel")}:</strong>{" "}
                          {properties.name}
                        </p>
                      )}
                      <p>
                        <strong>{t("beaconViewer.frequencyLabel")}:</strong>{" "}
                        {properties.frequency.toFixed(3)} MHz
                      </p>
                      <p>
                        <strong>{t("beaconViewer.antennaLabel")}:</strong>{" "}
                        {properties.antenna}
                      </p>
                      <p>
                        <strong>{t("beaconViewer.powerLabel")}:</strong>{" "}
                        {properties.power}W
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>{t("beaconViewer.qthLabel")}:</strong>{" "}
                        {properties.qthStr}
                      </p>
                      <p>
                        <strong>{t("beaconViewer.locatorLabel")}:</strong>{" "}
                        {properties.locator}
                      </p>
                      <p>
                        <strong>{t("beaconViewer.altitudeLabel")}:</strong>{" "}
                        {properties.hamsl}m
                      </p>
                      <p>
                        <strong>{t("beaconViewer.modeLabel")}:</strong>{" "}
                        {properties.mode}
                      </p>
                      <p>
                        <strong>{t("beaconViewer.qtfLabel")}:</strong>{" "}
                        {properties.qtf}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>{t("beaconViewer.maintainerLabel")}:</strong>{" "}
                    {beacon.owner ? (
                      <Link className="font-bold" to={`/u/${beacon.owner}`}>
                        {beacon.owner}
                      </Link>
                    ) : (
                      <span className="italic text-gray-500 dark:text-gray-400">
                        {t("beaconViewer.maintainerPending")}
                      </span>
                    )}
                  </p>

                  {properties.editAuthor?.callsign && properties.editDate && (
                    <Alert className="w-fit" color="warning">
                      <div>
                        <FaInfoCircle className="inline mr-2 mb-[2px]" />
                        {t("beaconViewer.changesByText")}
                        <Link
                          className="font-bold"
                          to={`/u/${properties.editAuthor.callsign}`}
                        >
                          {properties.editAuthor.callsign}
                        </Link>{" "}
                        {t("beaconViewer.onDateText")}{" "}
                        {formatInTimeZone(
                          new Date(properties.editDate),
                          "Europe/Rome",
                          `dd/MM/yyyy '${t("beaconViewer.atTimeText")}' HH:mm`,
                        )}
                      </div>
                    </Alert>
                  )}
                </Card>

                {properties.lat && properties.lon && (
                  <div className="drop-shadow-lg flex justify-center relative">
                    <MapContainer
                      center={[properties.lat, properties.lon]}
                      zoom={13}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        referrerPolicy="strict-origin-when-cross-origin"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />

                      <Marker
                        position={[properties.lat, properties.lon]}
                        icon={icon}
                      >
                        <Popup>
                          <p className="m-0 p-0">
                            <strong>{beacon.callsign}</strong>:<br />
                            <span className="text-center">
                              {properties.lat.toFixed(6)},{" "}
                              {properties.lon.toFixed(6)}
                            </span>
                          </p>
                        </Popup>
                      </Marker>

                      <MapWatermark />
                    </MapContainer>
                  </div>
                )}
              </>
            )}
          </ReactPlaceholder>
        </div>
      </div>
    </>
  );
};

export default ViewBeacon;
