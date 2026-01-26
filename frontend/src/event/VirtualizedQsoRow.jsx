import { Button, Checkbox, Spinner, Tooltip } from "flowbite-react";
import PropTypes from "prop-types";
import {
  FaCheck,
  FaEdit,
  FaEnvelope,
  FaExternalLinkAlt,
  FaTimes,
} from "react-icons/fa";
import { Link } from "react-router";

// Virtualized table row component
const VirtualizedQsoRow = ({ index, style, data }) => {
  const {
    qsos,
    user,
    highlighted,
    selectedQsos,
    setSelectedQsos,
    selectQso,
    disabled,
    eqslSending,
    forceSendEqsl,
    formatInTimeZone,
    onEdit,
  } = data;

  const q = qsos[index];

  return (
    <div style={style}>
      <div
        onClick={() => {
          setSelectedQsos(
            selectedQsos.includes(q._id)
              ? selectedQsos.filter((e) => e !== q._id)
              : [...selectedQsos, q._id],
          );
        }}
        className={`cursor-pointer transition-colors duration-200 flex items-center border-b border-gray-200 dark:border-gray-700 min-h-[60px] px-2 w-full ${
          highlighted === q._id
            ? "bg-green-200 hover:bg-green-300 dark:bg-green-900 dark:hover:bg-green-800"
            : selectedQsos.includes(q._id)
              ? "bg-yellow-200 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800"
              : index % 2 === 0
                ? "hover:bg-gray-200 dark:hover:bg-gray-600"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
        }`}
      >
        {/* Checkbox */}
        <div
          className="flex-shrink-0 flex justify-center items-center"
          style={{ width: "5%" }}
        >
          <Checkbox
            value={q._id}
            disabled={disabled}
            checked={selectedQsos.includes(q._id)}
            onChange={(e) => selectQso(q, e.target.checked)}
          />
        </div>

        {/* Station (Admin only) */}
        {user?.isAdmin && (
          <div
            className="flex-shrink-0 text-sm text-gray-900 dark:text-white"
            style={{ width: "12%" }}
          >
            {q.fromStationCallsignOverride || q.fromStation?.callsign}
          </div>
        )}

        {/* Callsign */}
        <div
          className={`flex-shrink-0 font-medium text-gray-900 dark:text-white`}
          style={{ width: user?.isAdmin ? "15%" : "18%" }}
        >
          {q.callsign}
        </div>

        {/* Date */}
        <div
          className={`flex-shrink-0 text-sm text-gray-900 dark:text-white`}
          style={{ width: user?.isAdmin ? "20%" : "25%" }}
        >
          {formatInTimeZone(q.qsoDate, "UTC", "yyyy-MM-dd HH:mm")}
        </div>

        {/* Band */}
        <div
          className={`flex-shrink-0 text-sm text-gray-900 dark:text-white`}
          style={{ width: user?.isAdmin ? "12%" : "15%" }}
        >
          {q.band || q.frequency}
        </div>

        {/* Mode */}
        <div
          className={`flex-shrink-0 text-sm text-gray-900 dark:text-white`}
          style={{ width: user?.isAdmin ? "10%" : "12%" }}
        >
          {q.mode}
        </div>

        {/* Locator */}
        <div
          className={`flex-shrink-0 text-sm text-gray-900 dark:text-white`}
          style={{ width: user?.isAdmin ? "12%" : "15%" }}
        >
          {q.toLocator}
        </div>

        {/* RST */}
        <div
          className={`flex-shrink-0 text-sm text-gray-900 dark:text-white`}
          style={{ width: user?.isAdmin ? "10%" : "12%" }}
        >
          {q.rst}
        </div>

        {/* Actions */}
        <div
          className={`flex justify-center items-center gap-1`}
          style={{ width: user?.isAdmin ? "14%" : "8%" }}
        >
          {(user?.isAdmin || user?.isDev || user?._id === q.fromStation) && (
            <Button
              color="light"
              size="sm"
              className="bg-gray-200 border-gray-200 hover:bg-gray-300"
              onClick={() => onEdit(q)}
            >
              <Tooltip content="Modifica QSO">
                <FaEdit />
              </Tooltip>
            </Button>
          )}

          <Button
            color={
              eqslSending.get(q._id) === "ok"
                ? "success"
                : eqslSending.get(q._id) === "failed"
                  ? "failure"
                  : q.emailSent
                    ? "light"
                    : "info"
            }
            disabled={eqslSending.get(q._id) === "sending"}
            onClick={() => forceSendEqsl(q)}
            className={`transition-all ${
              q.emailSent ? "bg-gray-200 border-gray-200 hover:bg-gray-300" : ""
            }`}
            size={q.emailSent ? "sm" : "md"}
          >
            <Tooltip
              className="transition-all"
              content={
                eqslSending.get(q._id) === "sending"
                  ? "Invio in corso..."
                  : eqslSending.get(q._id) === "ok"
                    ? "Email inviata con successo!"
                    : eqslSending.get(q._id) === "failed"
                      ? "Errore nell'invio, riprova"
                      : q.emailSent
                        ? "⚠️ eQSL già inviata, usa per reinviarla" +
                          (q.email ? ` a ${q.email}` : "")
                        : "Usa il pulsante per forzare l'invio" +
                          (q.email ? ` a ${q.email}` : "")
              }
            >
              {eqslSending.get(q._id) === "sending" ? (
                <Spinner
                  className="dark:text-white dark:fill-white"
                  size="sm"
                />
              ) : eqslSending.get(q._id) === "ok" ? (
                <FaCheck />
              ) : eqslSending.get(q._id) === "failed" ? (
                <FaTimes />
              ) : (
                <FaEnvelope />
              )}
            </Tooltip>
          </Button>

          {q.emailSent && (
            <Tooltip content="Apri eQSL">
              <Link to={`/qso/${q._id}`} target="_blank">
                <Button
                  color="light"
                  className="bg-gray-200 border-gray-200 hover:bg-gray-300"
                  size="sm"
                >
                  <FaExternalLinkAlt />
                </Button>
              </Link>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

VirtualizedQsoRow.propTypes = {
  index: PropTypes.number.isRequired,
  style: PropTypes.object.isRequired,
  data: PropTypes.shape({
    qsos: PropTypes.array.isRequired,
    user: PropTypes.object,
    highlighted: PropTypes.string,
    selectedQsos: PropTypes.array.isRequired,
    setSelectedQsos: PropTypes.func.isRequired,
    selectQso: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    eqslSending: PropTypes.instanceOf(Map).isRequired,
    forceSendEqsl: PropTypes.func.isRequired,
    formatInTimeZone: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
  }).isRequired,
};

VirtualizedQsoRow.displayName = "VirtualizedQsoRow";

export default VirtualizedQsoRow;
