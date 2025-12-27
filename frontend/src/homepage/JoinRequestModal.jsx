import { Option, Select } from "@material-tailwind/react";
import axios from "axios";
import { isAfter, isBefore } from "date-fns";
import { it } from "date-fns/locale";
import {
  Alert,
  Button,
  Checkbox,
  Label,
  Modal,
  Spinner,
  TextInput,
} from "flowbite-react";
import PropTypes from "prop-types";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { FaInfo } from "react-icons/fa";
import { Link } from "react-router";
import { EventsContext } from "../App";
import { getErrorStr } from "../shared";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import useUserStore from "../stores/userStore";

const JoinRequestModal = ({ open, setOpen, event, setEvent }) => {
  const user = useUserStore((store) => store.user);
  const { events } = useContext(EventsContext);
  const { t } = useTranslation();

  const [joinableEvents, setJoinableEvents] = useState(null);
  useEffect(() => {
    if (!events) return;
    const now = new Date();
    const joinable = events.filter(
      // in the future refactor, rn a debug event is used with date in 2040
      // so exclude events at or after 2040-01-01
      (e) => isAfter(e.date, now) && isBefore(e.date, new Date("2040-01-01")),
    );
    setJoinableEvents(joinable);
  }, [events]);

  const [joinError, setJoinError] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [antenna, setAntenna] = useState("");
  const [closable, setClosable] = useState(false);
  const [isSending, setIsSending] = useState(false);

  async function sendJoinRequest(e) {
    e.preventDefault();

    if (!event) return;

    setJoinError(null);
    setDisabled(true);
    setIsSending(true);

    try {
      await axios.post("/api/joinrequest", {
        antenna,
        forEvent: event._id,
      });

      setJoinError(null);
      setAlreadyJoined(true);
      setClosable(true);
    } catch (err) {
      console.log("sendJoinRequest error", err);
      setJoinError(getErrorStr(err?.response?.data?.err));
      setDisabled(false);
    } finally {
      setIsSending(false);
    }
  }

  const isBetweenDates = useCallback(() => {
    if (
      isBefore(new Date(), new Date(event.joinStart)) ||
      isAfter(new Date(), new Date(event.joinDeadline))
    ) {
      setDisabled(true);
      setClosable(true);
      return false;
    }
    return true;
  }, [event]);

  const [alreadyJoined, setAlreadyJoined] = useState(null);
  useEffect(() => {
    // if (!event) return;

    async function checkIfJoined() {
      if (!event) return;

      setDisabled(true);
      setClosable(true);
      try {
        await axios.get(`/api/joinrequest/event/${event._id}`);
        setAlreadyJoined(true);
      } catch (err) {
        console.log("checkIfJoined error", err);
        setAlreadyJoined(false);
        if (isBetweenDates()) setDisabled(false);
      }
    }

    checkIfJoined();
  }, [event, isBetweenDates]);

  useEffect(() => {
    if (!alreadyJoined) return;
    setDisabled(true);
    setClosable(true);
  }, [alreadyJoined]);

  useEffect(() => {
    console.log("join request modal event", event);
    console.log("join request modal joinable", joinableEvents);

    if (!event) return;
    if (!isBetweenDates()) setDisabled(false);
    28;
  }, [event, isBetweenDates, joinableEvents]);

  const noEventsToJoin = useMemo(() => {
    if (!Array.isArray(joinableEvents)) return false;
    return joinableEvents.length === 0;
  }, [joinableEvents]);

  return (
    <Modal
      position="center"
      dismissible
      show={open}
      onClose={() => setOpen(!open)}
    >
      <form onSubmit={sendJoinRequest}>
        <Modal.Header>
          {t("participationRequest")}{" "}
          <span className="underline">{!disabled && event?.name}</span>
        </Modal.Header>
        <Modal.Body>
          {event && (
            <div className="mt-3 mb-4">
              <Select
                variant="static"
                className="dark:text-gray-300"
                label="Evento per cui fare richiesta"
                disabled={!joinableEvents || (disabled && !closable)}
                value={joinableEvents?.[0].name}
              >
                {joinableEvents?.map((e) => (
                  <Option key={e._id} onClick={() => setEvent(e)}>
                    {e.name}{" "}
                    <span className="text-gray-400">
                      ({formatInTimeZone(e.date, "Europe/Rome", "dd/MM/yyyy")})
                    </span>
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {alreadyJoined === null ? (
            noEventsToJoin ? (
              <Alert color="info" className="mb-4">
                <span>
                  <span className="inline">
                    <FaInfo className="inline" />
                  </span>{" "}
                  {t("noEventsToJoin")}
                </span>
              </Alert>
            ) : (
              <Spinner />
            )
          ) : alreadyJoined ? (
            <Alert color="info" className="mb-4">
              <span>
                <span className="inline">
                  <FaInfo className="inline" />
                </span>{" "}
                <Trans
                  i18nKey="requestParticipation"
                  values={{ eventName: event.name }}
                  components={{
                    Link: (
                      <Link
                        to="/profile"
                        className="underline decoration-dotted hover:text-black transition-colors"
                      />
                    ),
                  }}
                />
              </span>
            </Alert>
          ) : isAfter(new Date(), new Date(event.joinDeadline)) ? (
            <Alert color="warning" className="mb-4">
              <span>
                <span className="font-medium">{t("attention")}</span>{" "}
                {t("requestTimeExpired")}{" "}
                {formatInTimeZone(
                  new Date(event.joinDeadline),
                  "Europe/Rome",
                  "dd/MM/yyyy 'alle ore' HH:mm",
                  {
                    locale: it,
                  },
                )}
                .
              </span>
            </Alert>
          ) : isBefore(new Date(), new Date(event.joinStart)) ? (
            <Alert color="warning" className="mb-4">
              <span>
                <span className="font-medium">{t("attention")}</span>{" "}
                {t("requestTimeStart")}{" "}
                {formatInTimeZone(
                  new Date(event.joinStart),
                  "Europe/Rome",
                  "dd/MM/yyyy 'alle ore' HH:mm",
                  {
                    locale: it,
                  },
                )}
                .
              </span>
            </Alert>
          ) : (
            <>
              {joinError && (
                <Alert color="failure" className="mb-4">
                  <span>
                    <span className="font-medium">{t("Error")}</span>{" "}
                    {joinError}
                  </span>
                </Alert>
              )}

              <div className="flex flex-col gap-4">
                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  {t("formEvent")}
                </p>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="antenna" value="Antenna in uso" />
                  </div>
                  <TextInput
                    id="antenna"
                    name="antenna"
                    type="text"
                    autoComplete="off"
                    required
                    disabled={disabled}
                    value={antenna}
                    onChange={(e) => setAntenna(e.target.value)}
                    helperText="Informazioni sull'antenna utilizzata per questo evento"
                  />
                </div>
                <div className="my-1">
                  <Checkbox
                    className="checked:bg-current mr-1"
                    id="accept-tos"
                    required
                  />
                  <Label htmlFor="accept-tos">
                    {t("viewRulesDeclaration")}{" "}
                    <a
                      href="/docs/Regolamento_FLASH_MOB_2023_01_23.pdf"
                      target="_blank"
                      className="underline"
                      rel="noopener"
                    >
                      {t("rules")}
                    </a>
                  </Label>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="w-full flex justify-center gap-2">
            <Button
              color="gray"
              type="button"
              disabled={disabled && !closable && !noEventsToJoin}
              onClick={() => setOpen(false)}
            >
              {t("close")}
            </Button>
            <Button type="submit" disabled={disabled}>
              {isSending ? (
                <Spinner />
              ) : (
                <span>
                  {t("sendRequestAs")} {user?.callsign}
                </span>
              )}
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

JoinRequestModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  event: PropTypes.object,
  setEvent: PropTypes.func.isRequired,
};

JoinRequestModal.displayName = "JoinRequestModal";

export default JoinRequestModal;
