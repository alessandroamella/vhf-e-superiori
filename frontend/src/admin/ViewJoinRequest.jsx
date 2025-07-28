import axios from "axios";
import { it } from "date-fns/locale";
import { Badge, Button, Table, Tooltip } from "flowbite-react";
import PropTypes from "prop-types";
import ReactHTMLTableToExcel from "react-html-table-to-excel";
import {
  FaBan,
  FaDownload,
  FaExclamation,
  FaStamp,
  FaTrash,
} from "react-icons/fa";
import { Link } from "react-router";
import { getErrorStr } from "../shared";
import { formatInTimeZone } from "../shared/formatInTimeZone";

const ViewJoinRequest = ({
  disabled,
  setDisabled,
  joinRequests,
  setJoinRequests,
  setAlert,
  showEvent,
}) => {
  async function approveJoinRequests(j) {
    if (
      !window.confirm(
        `Vuoi ${
          j.isApproved ? "ANNULLARE" : "APPROVARE"
        } la richiesta di partecipazione con ID ${j._id}?`,
      )
    ) {
      return;
    }
    setDisabled(true);
    try {
      await axios.post("/api/joinrequest/" + j._id);
      console.log("approved joinRequest", j);
      const _joinRequests = [
        ...joinRequests.filter((_j) => _j._id !== j._id),
        { ...j, isApproved: !j.isApproved, updatedAt: new Date() },
      ];
      _joinRequests.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setJoinRequests(_joinRequests);
    } catch (err) {
      console.log(err.response.data);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
    } finally {
      setDisabled(false);
    }
  }

  async function deleteJoinRequests(j) {
    if (
      !window.confirm(
        "Vuoi ELIMINARE la richiesta di partecipazione con ID " + j._id + "?",
      )
    ) {
      return;
    }

    setDisabled(true);
    try {
      await axios.delete("/api/joinrequest/" + j._id);
      console.log("deleted joinRequest", j);
      setJoinRequests([...joinRequests.filter((_j) => _j._id !== j._id)]);
    } catch (err) {
      console.log(err.response.data);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
    } finally {
      setDisabled(false);
    }
  }

  return (
    <>
      <Button className="mx-auto mb-2 flex items-center">
        <FaDownload className="mr-1" />
        <ReactHTMLTableToExcel
          className="download-table-xls-button"
          table={`join-requests-list-${JSON.stringify(joinRequests?.length)}`}
          filename={"lista-richieste"}
          sheet="lista"
          buttonText="Scarica come Excel"
        />
      </Button>
      <Table
        id={`join-requests-list-${JSON.stringify(joinRequests?.length)}`}
        striped
      >
        <Table.Head>
          <Table.HeadCell>Nominativo</Table.HeadCell>
          <Table.HeadCell>Nome</Table.HeadCell>
          <Table.HeadCell>Telefono</Table.HeadCell>
          <Table.HeadCell>Stato richiesta</Table.HeadCell>
          <Table.HeadCell>Data creazione</Table.HeadCell>
          <Table.HeadCell>Antenna</Table.HeadCell>
          {showEvent && <Table.HeadCell>Evento</Table.HeadCell>}
          <Table.HeadCell>
            <span className="sr-only">Azioni</span>
          </Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
          {joinRequests?.map((j) => (
            <Table.Row key={j._id}>
              <Table.Cell className="whitespace-nowrap font-medium">
                <Link
                  to={`/u/${j.fromUser.callsign}`}
                  className="text-red-400 hover:text-black dark:hover:text-red-200 transition-colors"
                >
                  {j.fromUser.callsign}
                </Link>
              </Table.Cell>
              <Table.Cell>
                <Tooltip content={j.fromUser.email}>
                  <a
                    href={"mailto:" + j.fromUser.email}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-black dark:hover:text-red-200 transition-colors"
                  >
                    {j.fromUser.name}
                  </a>
                </Tooltip>
              </Table.Cell>
              <Table.Cell>
                <a
                  href={"tel:" + j.fromUser.phoneNumber}
                  className="text-red-400 hover:text-black dark:hover:text-red-200 transition-colors"
                >
                  {j.fromUser.phoneNumber}
                </a>
              </Table.Cell>
              <Table.Cell>
                {j.isApproved ? (
                  <span className="ml-1 font-semibold dark:text-gray-300">
                    ✅ Approvata
                  </span>
                ) : (
                  <span className="ml-1 flex items-center gap-1 font-bold dark:text-gray-300">
                    ⌛ In attesa{" "}
                    <Badge color="failure">
                      <FaExclamation />
                    </Badge>
                  </span>
                )}
              </Table.Cell>
              <Table.Cell className="dark:text-gray-300">
                {formatInTimeZone(
                  new Date(j.createdAt),
                  "Europe/Rome",
                  "d MMM yyyy HH:mm",
                  {
                    locale: it,
                  },
                )}
              </Table.Cell>
              <Table.Cell className="max-w-xs dark:text-gray-300">
                <Tooltip content={j.antenna}>
                  <p className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {j.antenna}
                  </p>
                </Tooltip>
              </Table.Cell>
              {showEvent && (
                <Table.Cell>
                  <Link
                    to={`/event/${j.forEvent._id}`}
                    className="text-red-400 hover:text-black dark:hover:text-red-200 transition-colors"
                  >
                    {j.forEvent.name}
                  </Link>
                </Table.Cell>
              )}
              <Table.Cell>
                <Button.Group>
                  {j.isApproved ? (
                    <Button
                      color="warning"
                      onClick={() => approveJoinRequests(j)}
                      disabled={disabled}
                    >
                      <Tooltip content="Annulla approvazione">
                        <FaBan />
                      </Tooltip>
                    </Button>
                  ) : (
                    <Button
                      color="success"
                      onClick={() => approveJoinRequests(j)}
                      disabled={disabled}
                    >
                      <Tooltip content="Approva richiesta">
                        <FaStamp />
                      </Tooltip>
                    </Button>
                  )}

                  <Button
                    color="failure"
                    onClick={() => deleteJoinRequests(j)}
                    disabled={disabled}
                  >
                    <Tooltip content="Elimina richiesta">
                      <FaTrash />
                    </Tooltip>
                  </Button>
                </Button.Group>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
};

ViewJoinRequest.propTypes = {
  disabled: PropTypes.bool,
  setDisabled: PropTypes.func,
  joinRequests: PropTypes.array,
  setJoinRequests: PropTypes.func,
  setAlert: PropTypes.func,
  showEvent: PropTypes.bool,
};

ViewJoinRequest.displayName = "ViewJoinRequest";

export default ViewJoinRequest;
