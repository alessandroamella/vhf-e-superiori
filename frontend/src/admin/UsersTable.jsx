import classNames from "classnames";
import {
  Badge,
  Button,
  Spinner,
  Table,
  TextInput,
  Tooltip
} from "flowbite-react";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { FaExternalLinkAlt, FaSearch, FaTimes } from "react-icons/fa";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import { useScreenDetector } from "../hooks/useScreenDetector";
import CallsignLoading from "../shared/CallsignLoading";

const UsersTable = ({
  users,
  disabled,
  setUserEditing,
  setJoinRequestsModal
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const tableRef = useRef(null);
  const ROW_HEIGHT = 80;

  useEffect(() => {
    if (Array.isArray(users)) {
      setFilteredUsers(
        users.filter((user) => {
          const searchLower = searchTerm.toLowerCase();
          return (
            user.callsign.toLowerCase().includes(searchLower) ||
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.phoneNumber?.toLowerCase().includes(searchLower) ||
            user.locator?.toLowerCase().includes(searchLower)
          );
        })
      );
    }
  }, [users, searchTerm]);

  const { isMobile } = useScreenDetector();

  const renderTableHeader = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <TextInput
          id="search"
          type="text"
          className="w-full"
          icon={FaSearch}
          placeholder="Cerca utenti..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Table striped>
        <Table.Head>
          <Table.HeadCell className="w-36">Nominativo</Table.HeadCell>
          <Table.HeadCell className="w-36">Nome</Table.HeadCell>
          {!isMobile && (
            <>
              <Table.HeadCell className="w-36">Email</Table.HeadCell>
              <Table.HeadCell className="w-36">Telefono</Table.HeadCell>
            </>
          )}
          <Table.HeadCell className="w-36">Richieste</Table.HeadCell>
        </Table.Head>
      </Table>
    </>
  );

  // eslint-disable-next-line react/prop-types
  const RowRenderer = ({ index, style }) => {
    const u = filteredUsers[index];

    return (
      <div
        style={style}
        onClick={() => !disabled && setUserEditing(u)}
        className={classNames(
          "border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700",
          {
            "cursor-pointer": !disabled,
            "cursor-not-allowed": disabled
          }
        )}
      >
        <div className="grid grid-cols-3 md:grid-cols-5 h-full">
          <div className="flex gap-2 items-center whitespace-nowrap text-gray-900 dark:text-white p-4 w-32">
            <CallsignLoading short user={u} />
          </div>
          <div className="flex items-center dark:text-gray-300 p-4 w-36 md:w-48">
            {u.isAdmin ? (
              <Tooltip content="Amministratore">{u.name}</Tooltip>
            ) : (
              <span>{u.name}</span>
            )}
          </div>
          <div className="hidden md:flex items-center p-4 w-64">
            <a
              href={"mailto:" + u.email}
              className="text-red-500 hover:text-red-600 transition-colors"
            >
              {u.email}
            </a>
          </div>
          <div className="hidden md:flex items-center p-4 w-32">
            <a
              href={"tel:" + u.phoneNumber}
              className="text-red-500 hover:text-red-600 transition-colors"
            >
              {u.phoneNumber}
            </a>
          </div>
          <div className="flex items-center p-4 w-24">
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
          </div>
        </div>
      </div>
    );
  };

  // Loading and error states
  if (!users) return <Spinner />;
  if (users === false) return <p>Errore nel caricamento degli utenti</p>;

  return (
    <div className="flex flex-col">
      {renderTableHeader()}
      <div className="h-96" ref={tableRef}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              itemCount={filteredUsers.length}
              itemSize={ROW_HEIGHT}
              width={width}
            >
              {RowRenderer}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
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
