import { Button, Input, Typography } from "@material-tailwind/react";
import axios from "axios";
import { Alert } from "flowbite-react";
import React, { useRef, useState } from "react";
import { useEffect } from "react";
import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorStr, UserContext } from "..";
import Layout from "../Layout";

const Login = () => {
    const [callsign, setCallsign] = useState("");
    const [password, setPassword] = useState("");

    const [alert, setAlert] = useState(null);
    const [disabled, setDisabled] = useState(false);

    const { user, setUser } = useContext(UserContext);

    const navigate = useNavigate();

    useEffect(() => {
        if (alert) loginInput.current?.focus();
    }, [alert]);

    async function login(e) {
        e.preventDefault();
        setDisabled(true);
        try {
            const { data } = await axios.post("/api/auth/login", {
                callsign,
                password
            });
            console.log(data);
            setUser(data);
            navigate("/");
        } catch (err) {
            console.log(err.response.data);
            setAlert({
                color: "failure",
                msg: getErrorStr(err?.response?.data?.err)
            });
            setUser(null);
            setDisabled(false);
        }
    }

    const loginInput = useRef(null);

    return (
        <Layout>
            {user && navigate("/profile")}
            <div className="mx-auto px-2 w-full md:w-2/3 mt-12">
                <Typography variant="h1" className="mb-2">
                    Login
                </Typography>

                <Typography variant="small" className="mb-6">
                    Non hai un account? <Link to="/signup">Registrati qui</Link>
                </Typography>

                {alert && (
                    <Alert
                        className="mb-6"
                        color={alert.color}
                        onDismiss={() => setAlert(null)}
                    >
                        <span>{alert.msg}</span>
                    </Alert>
                )}

                <form action="#" method="post" onSubmit={login}>
                    <Input
                        type="text"
                        name="callsign"
                        label="Nominativo"
                        value={callsign}
                        onChange={e => setCallsign(e.target.value)}
                        disabled={disabled}
                        ref={loginInput}
                        autoComplete="callsign"
                        autoFocus
                    />
                    <div className="my-4" />
                    <Input
                        type="password"
                        name="password"
                        label="Password"
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={disabled}
                    />
                    <div className="my-4" />
                    <Button type="submit" disabled={disabled}>
                        Login
                    </Button>
                </form>
            </div>
        </Layout>
    );
};

export default Login;
