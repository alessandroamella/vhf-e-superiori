import axios from "axios";
import {
  Alert,
  Button,
  Checkbox,
  Label,
  Modal,
  TextInput,
  Tooltip,
} from "flowbite-react";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import ReactGoogleAutocomplete from "react-google-autocomplete";
import { FaExclamationTriangle, FaKey } from "react-icons/fa";
import ReactPlaceholder from "react-placeholder";
import { mapsApiKey } from "../constants/mapsApiKey";
import { getErrorStr } from "../shared";
import CallsignLoading from "../shared/CallsignLoading";

const EditUserModal = ({
  showEditUserModal,
  setShowEditUserModal,
  userEditing,
  setUserEditing,
  getUsers,
  setAlert,
  disabled,
  setDisabled,
  user,
}) => {
  const [addressInput, setAddressInput] = useState("");
  const addressInputRef = useRef(null);
  const [editAlert, setEditAlert] = useState(null);
  const editUserRef = useRef(null);

  useEffect(() => {
    if (!userEditing) {
      setShowEditUserModal(false);
      setAddressInput("");
      return;
    }
    setShowEditUserModal(true);
    setAddressInput(userEditing.address || "");
  }, [userEditing, setShowEditUserModal]);

  useEffect(() => {
    if (!editAlert || !editUserRef.current) return;

    // scroll div to top
    editUserRef.current.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [editAlert]);

  async function submitEditUser(e) {
    e.preventDefault();

    setEditAlert(null);

    if (!window.confirm(`Vuoi modificare l'utente ${userEditing.callsign}?`)) {
      return;
    }

    setDisabled(true);
    try {
      await axios.put(`/api/auth/${userEditing._id}`, userEditing);
      await getUsers();
      setUserEditing(null);
    } catch (err) {
      console.log(err);
      setEditAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
    } finally {
      setDisabled(false);
    }
  }

  async function sendPwResetMail() {
    if (
      !window.confirm(
        `Vuoi inviare una email di reset password all'utente ${userEditing.callsign} (email: ${userEditing.email})?`,
      )
    ) {
      return;
    }
    setDisabled(true);
    try {
      await axios.post("/api/auth/sendresetpw", {
        email: userEditing.email,
        token: "nope", // admin so no captcha
      });
      window.alert("Email inviata");
    } catch (err) {
      console.log(err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
      setUserEditing(null);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setDisabled(false);
    }
  }

  return (
    <Modal
      position="center"
      size="7xl"
      show={showEditUserModal}
      onClose={() => setShowEditUserModal(null)}
    >
      <form onSubmit={submitEditUser}>
        <Modal.Header>
          <div className="flex items-center gap-2">
            Modifica utente <CallsignLoading user={userEditing} />
          </div>
        </Modal.Header>
        <Modal.Body>
          <ReactPlaceholder
            ready={userEditing}
            showLoadingAnimation
            type="text"
            rows={10}
          >
            <div
              ref={editUserRef}
              className="space-y-2 flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-4"
            >
              {editAlert && (
                <Alert
                  color={editAlert.color}
                  onDismiss={() => setEditAlert(null)}
                >
                  <span>{editAlert.msg}</span>
                </Alert>
              )}
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="user-name" value="Nome" />
                </div>
                <TextInput
                  id="user-name"
                  type="text"
                  required={true}
                  value={userEditing?.name}
                  onChange={(e) =>
                    setUserEditing({ ...userEditing, name: e.target.value })
                  }
                  disabled={disabled}
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="user-address" value="Indirizzo" />
                </div>
                <ReactGoogleAutocomplete
                  apiKey={mapsApiKey}
                  options={{
                    types: ["geocode"],
                  }}
                  onPlaceSelected={(place) => {
                    console.log("place", place);
                    const addr = place.formatted_address;
                    let cityIndex = place.address_components.findIndex((c) =>
                      c.types.includes("administrative_area_level_3"),
                    );
                    if (cityIndex === -1) {
                      cityIndex = 1;
                    }
                    const city = place.address_components[cityIndex].long_name;
                    const province =
                      place.address_components[cityIndex + 1].short_name;

                    setUserEditing({
                      ...userEditing,
                      city,
                      province,
                      lat: place.geometry.location.lat(),
                      lon: place.geometry.location.lng(),
                      address: addr,
                    });
                  }}
                  className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 rounded-lg p-2.5 text-sm"
                  id="address"
                  name="addressInput"
                  lang="it"
                  language="it"
                  type="text"
                  placeholder="Modena"
                  autoComplete="address-level4"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onBlur={() => setAddressInput(userEditing?.address || "")}
                  disabled={!user}
                  helperText="Inserisci l'indirizzo di stazione (la via)"
                  ref={addressInputRef}
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label
                    htmlFor="user-email"
                    value={`Email ${
                      typeof userEditing?.isVerified !== "boolean"
                        ? "(caricamento...)"
                        : userEditing?.isVerified
                          ? "(✅ verificata)"
                          : "(❌ non verificata)"
                    }`}
                  />
                </div>
                <TextInput
                  id="user-email"
                  type="email"
                  required={true}
                  value={userEditing?.email}
                  onChange={(e) =>
                    setUserEditing({
                      ...userEditing,
                      email: e.target.value,
                    })
                  }
                  disabled={disabled}
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="user-phone" value="Telefono" />
                </div>
                <TextInput
                  id="user-phone"
                  type="tel"
                  required={true}
                  value={userEditing?.phoneNumber}
                  onChange={(e) =>
                    setUserEditing({
                      ...userEditing,
                      phoneNumber: e.target.value,
                    })
                  }
                  disabled={disabled}
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="user-callsign" value="Nominativo" />
                </div>
                <TextInput
                  id="user-callsign"
                  type="text"
                  required={true}
                  value={userEditing?.callsign}
                  onChange={(e) =>
                    setUserEditing({
                      ...userEditing,
                      callsign: e.target.value.toUpperCase(),
                    })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900 flex flex-col items-center gap-4">
                <h3 className="text-red-800 dark:text-red-200 font-semibold flex items-center gap-2">
                  <FaExclamationTriangle className="inline" />
                  Attenzione a modificare i permessi!
                </h3>
                <div className="flex justify-center gap-4 md:gap-8">
                  <div className="flex items-center gap-2">
                    <Tooltip
                      content={
                        userEditing?._id === user?._id
                          ? "Non puoi rimuovere i tuoi permessi"
                          : userEditing?.isAdmin
                            ? "ATTENZIONE: rimuovendo i permessi di amministratore, l'utente non potrà più accedere a questa pagina e non potrà più gestire gli eventi."
                            : "Concedi i permessi di amministratore"
                      }
                    >
                      <Checkbox
                        id="user-admin"
                        checked={userEditing?.isAdmin}
                        onChange={(e) =>
                          setUserEditing({
                            ...userEditing,
                            isAdmin: e.target.checked,
                          })
                        }
                        disabled={disabled || userEditing?._id === user?._id}
                      />
                      <Label
                        className="ml-1 select-none dark:text-gray-100"
                        htmlFor="user-admin"
                        value="Amministratore"
                      />
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip
                      content={
                        userEditing?.isVerified
                          ? "Rimuovi la verifica dell'email (l'utente dovrà verificarla nuovamente)"
                          : "Verifica l'email dell'utente manualmente"
                      }
                    >
                      <Checkbox
                        id="user-verified"
                        checked={userEditing?.isVerified}
                        onChange={(e) =>
                          setUserEditing({
                            ...userEditing,
                            isVerified: e.target.checked,
                          })
                        }
                        disabled={disabled}
                      />
                      <Label
                        className="ml-1 select-none dark:text-gray-100"
                        htmlFor="user-verified"
                        value="Email verificata"
                      />
                    </Tooltip>
                  </div>
                  <Button
                    color="info"
                    onClick={() => sendPwResetMail()}
                    disabled={disabled}
                  >
                    <FaKey className="inline mr-1" />
                    Invia email reset password
                  </Button>
                </div>
              </div>
            </div>
          </ReactPlaceholder>
        </Modal.Body>
        <Modal.Footer>
          <div className="w-full flex justify-center gap-2">
            <Button
              color="gray"
              type="button"
              // disabled={!user || changePwBtnDisabled}
              disabled={disabled}
              onClick={() => setUserEditing(null)}
            >
              Chiudi
            </Button>
            <Button disabled={disabled} color="info" type="submit">
              Applica modifiche
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

EditUserModal.propTypes = {
  showEditUserModal: PropTypes.bool,
  setShowEditUserModal: PropTypes.func,
  userEditing: PropTypes.object,
  setUserEditing: PropTypes.func,
  getUsers: PropTypes.func,
  setAlert: PropTypes.func,
  disabled: PropTypes.bool,
  setDisabled: PropTypes.func,
  user: PropTypes.object,
};

EditUserModal.displayName = "EditUserModal";

export default EditUserModal;
