import Layout from "../Layout";
import { Typography } from "@material-tailwind/react";
import { useContext } from "react";
import { getErrorStr, UserContext } from "..";
import {
    Alert,
    Button,
    Label,
    Modal,
    Spinner,
    TextInput
} from "flowbite-react";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Profile = () => {
    const { user, setUser } = useContext(UserContext);

    const [showChangePwModal, setShowChangePwModal] = useState(false);
    const [changePwBtnDisabled, setChangePwBtnDisabled] = useState(false);
    const [changeDataBtnDisabled, setChangeDataBtnDisabled] = useState(true);

    const [alert, setAlert] = useState(null);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        if (!user) return;
        setName(user.name);
        setEmail(user.email);
    }, [user]);

    useEffect(() => {
        console.log({ name, email, user });
        setChangeDataBtnDisabled(
            !user ||
                (name?.trim() === user.name && email?.trim() === user.email)
        );
    }, [name, email, user]);

    async function changePassword(e) {
        e.preventDefault();
        setChangePwBtnDisabled(true);
    }

    async function changeData(e) {
        e.preventDefault();

        setChangeDataBtnDisabled(true);

        try {
            const { data } = await axios.put("/api/auth", { name, email });
            setAlert({ color: "success", msg: "Dati modificati con successo" });
            setUser(data);
        } catch (err) {
            setAlert({
                color: "failure",
                msg: getErrorStr(err?.response?.data?.err)
            });
        }

        setChangeDataBtnDisabled(false);
    }

    async function logout() {
        try {
            await axios.post("/api/auth/logout");
            setAlert({ color: "success", msg: "Logout avvenuto con successo" });
            setUser(null);
        } catch (err) {
            setAlert({
                color: "failure",
                msg: getErrorStr(err?.response?.data?.err)
            });
        }
    }

    return (
        <Layout>
            <Modal
                show={showChangePwModal}
                onClose={() => setShowChangePwModal(false)}
            >
                <form onSubmit={changePassword}>
                    <Modal.Header>Cambio password</Modal.Header>
                    <Modal.Body>
                        <Alert color="failure" className="mb-4">
                            <span>
                                <span className="font-medium">DEBUG</span>{" "}
                                Questo form non è ancora funzionante
                            </span>
                        </Alert>
                        <div className="flex flex-col gap-4">
                            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                                Usa il seguente form per cambiare la password
                            </p>

                            <div>
                                <div className="mb-2 block">
                                    <Label
                                        htmlFor="current-password"
                                        value="Password attuale"
                                    />
                                </div>
                                <TextInput
                                    id="current-password"
                                    type="password"
                                    autoComplete="current-password"
                                    required={true}
                                    disabled={!user || changePwBtnDisabled}
                                />
                            </div>
                            <div>
                                <div className="mb-2 block">
                                    <Label
                                        htmlFor="new-password"
                                        value="Nuova password"
                                    />
                                </div>
                                <TextInput
                                    id="new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required={true}
                                    disabled={!user || changePwBtnDisabled}
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <div className="w-full flex justify-center gap-2">
                            <Button
                                color="gray"
                                type="button"
                                disabled={!user || changePwBtnDisabled}
                                onClick={() => setShowChangePwModal(false)}
                            >
                                Chiudi
                            </Button>
                            <Button
                                type="submit"
                                disabled={!user || changePwBtnDisabled}
                            >
                                Cambia password
                            </Button>
                        </div>
                    </Modal.Footer>
                </form>
            </Modal>

            <div className="py-3 md:py-6 px-6 md:px-12 lg:px-24">
                <Typography variant="h3" className="my-4">
                    Profilo
                </Typography>
                <Typography variant="h1" className="mb-8">
                    {user === null ? (
                        <Link to="/login" className="underline">
                            Accedi per visualizzare il profilo
                        </Link>
                    ) : user ? (
                        <div className="flex flex-col md:flex-row md:items-center">
                            <div className="flex items-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    className="scale-150"
                                >
                                    <path d="M22 8h-20c-1.104 0-2 .896-2 2v12c0 1.104.896 2 2 2h20c1.104 0 2-.896 2-2v-12c0-1.104-.896-2-2-2zm-19 3h11v2h-11v-2zm14 5v1h-10v-1h10zm0 5h-10v-1h10v1zm2-2h-14v-1h14v1zm2-6h-6v-2h6v2zm-14-6h-4v-1h4v1zm4.421-4.448l-2.18-1.567c-.244-.178-.297-.519-.12-.762.178-.243.518-.296.761-.119l2.186 1.569-.647.879zm8.246 4.448h-2.442l-5.099-3.677.891-1.219 6.65 4.896z" />
                                </svg>
                                <span className="ml-4">{user.callsign}</span>
                            </div>

                            <Button
                                className="md: ml-4"
                                type="button"
                                color="gray"
                                onClick={logout}
                            >
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <Spinner />
                    )}
                </Typography>

                {alert && (
                    <Alert color={alert.color} onDismiss={() => setAlert(null)}>
                        <span>{alert.msg}</span>
                    </Alert>
                )}

                <form
                    className="flex flex-col gap-4 mt-4"
                    onSubmit={changeData}
                >
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="name" value="Nome" />
                        </div>
                        <TextInput
                            id="name"
                            type="text"
                            placeholder="Alessandro Amella"
                            required={true}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={!user}
                        />
                    </div>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="email" value="Email" />
                        </div>
                        <TextInput
                            id="email"
                            type="email"
                            placeholder="alessandro@iu4qsg.it"
                            required={true}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={!user}
                        />
                    </div>

                    <Button
                        className="mt-2"
                        type="submit"
                        disabled={!user || changeDataBtnDisabled}
                    >
                        Modifica dati
                    </Button>

                    <small className="mt-4">
                        Se hai sbagliato a inserire il nominativo o desideri
                        eliminare il tuo account, per favore procedi a inviarci
                        una mail ad{" "}
                        <a
                            href="mailto:alessandro@iu4qsg.it"
                            target="_blank"
                            rel="noreferrer"
                        >
                            alessandro@iu4qsg.it
                        </a>
                        .
                    </small>
                </form>
                <div className="mt-4 flex items-center gap-4">
                    <span>
                        Password attuale: <strong>{"*".repeat(8)}</strong>
                    </span>
                    <Button onClick={() => setShowChangePwModal(true)}>
                        Cambia password
                    </Button>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
