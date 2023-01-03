import { Button, Input, Typography } from "@material-tailwind/react";
import axios, { isAxiosError } from "axios";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../Layout";

const Signup = () => {
    const [callsign, setCallsign] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");

    async function signup(e) {
        e.preventDefault();
        try {
            const { data } = await axios.post("/api/auth/signup", {
                callsign,
                name,
                password,
                email
            });
            console.log(data);
            alert("ok");
        } catch (err) {
            alert((isAxiosError(err) && err.response?.data) || "non va");
        }
    }

    return (
        <Layout>
            <div className="mx-auto px-2 w-full md:w-2/3 mt-12">
                <Typography variant="h1" className="mb-2">
                    Registrazione
                </Typography>

                <Typography variant="small" className="mb-6">
                    Hai già un account?{" "}
                    <Link to="/signup">Fai il login qui</Link>
                </Typography>
                <form action="#" method="post" onSubmit={signup}>
                    <Input
                        type="text"
                        name="callsign"
                        label="Nominativo"
                        value={callsign}
                        onChange={e => setCallsign(e.target.value)}
                    />
                    <div className="my-4" />
                    <Input
                        type="text"
                        name="name"
                        label="Nome"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                    <div className="my-4" />
                    <Input
                        type="password"
                        name="password"
                        label="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <div className="my-4" />
                    <Input
                        type="email"
                        name="email"
                        label="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <div className="my-4" />
                    <Button type="submit">Registrati</Button>
                </form>
            </div>
        </Layout>
    );
};

export default Signup;
