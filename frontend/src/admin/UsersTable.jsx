import { Badge, Button, Spinner, Table, Tooltip } from "flowbite-react";
import PropTypes from "prop-types";
import { FaExternalLinkAlt, FaTimes, FaUserShield } from "react-icons/fa";
import { formatInTimeZone } from "../shared/formatInTimeZone";

const UsersTable = ({
  users,
  disabled,
  setUserEditing,
  setJoinRequestsModal
}) => {
  return users ? (
    <Table striped>
      <Table.Head>
        <Table.HeadCell>Nominativo</Table.HeadCell>
        <Table.HeadCell>Nome</Table.HeadCell>
        <Table.HeadCell>Email</Table.HeadCell>
        <Table.HeadCell>Telefono</Table.HeadCell>
        <Table.HeadCell>Creazione</Table.HeadCell>
        <Table.HeadCell>Locatore</Table.HeadCell>
        <Table.HeadCell>Richieste</Table.HeadCell>
      </Table.Head>
      <Table.Body>
        {users?.map(u => (
          <Table.Row key={u._id}>
            <Table.Cell className="flex gap-2 items-center whitespace-nowrap text-gray-900 dark:text-white">
              <Button
                size="sm"
                color="info"
                onClick={() => setUserEditing(u)}
                disabled={disabled}
              >
                {u.isAdmin && <FaUserShield className="inline mr-1" />}
                {u.callsign}
              </Button>
            </Table.Cell>
            <Table.Cell className="dark:text-gray-300">
              {u.isAdmin ? (
                <Tooltip content="Amministratore"> {u.name}</Tooltip>
              ) : (
                <span>{u.name}</span>
              )}
            </Table.Cell>
            <Table.Cell>
              <a
                href={"mailto:" + u.email}
                className="text-red-500 hover:text-red-600 transition-colors"
              >
                {u.email}
              </a>
            </Table.Cell>
            <Table.Cell>
              <a
                href={"tel:" + u.phoneNumber}
                className="text-red-500 hover:text-red-600 transition-colors"
              >
                {u.phoneNumber}
              </a>
            </Table.Cell>
            <Table.Cell>
              {formatInTimeZone(u.createdAt, "Europe/Rome", "dd/MM/yyyy ")}
            </Table.Cell>
            <Table.Cell>
              {u.locator ? (
                <Tooltip
                  content={`${u.lat},${u.lon} (${
                    u.address || "Indirizzo sconosciuto"
                  })`}
                >
                  <span>{u.locator}</span>
                </Tooltip>
              ) : (
                <FaTimes />
              )}
            </Table.Cell>
            <Table.Cell>
              {u.joinRequests.length !== 0 ? (
                <Button
                  color="info"
                  onClick={() => setJoinRequestsModal(u.joinRequests)}
                >
                  <Badge color="info">{u.joinRequests.length}</Badge>
                  <span className="ml-1">
                    <FaExternalLinkAlt />
                  </span>
                </Button>
              ) : (
                <FaTimes />
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ) : users === false ? (
    <Spinner />
  ) : (
    <p>Errore nel caricamento degli utenti</p>
  );
};

UsersTable.propTypes = {
  users: PropTypes.array,
  disabled: PropTypes.bool,
  setUserEditing: PropTypes.func,
  setJoinRequestsModal: PropTypes.func
};
UsersTable.displayName = "UsersTable";

export default UsersTable;
