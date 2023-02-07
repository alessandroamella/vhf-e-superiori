import { Alert, Button, Label, TextInput } from "flowbite-react";
import React, { useState } from "react";
import Layout from "../Layout";
import { Typography } from "@material-tailwind/react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { getErrorStr } from "..";

const ResetPw = () => {
  const [pw, setPw] = useState("");
  const [alert, setAlert] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const [searchParams] = useSearchParams();

  async function resetPw(e) {
    e.preventDefault();

    setDisabled(true);
    try {
      await axios.post("/api/auth/resetpw", {
        user: searchParams.get("user"),
        passwordResetCode: searchParams.get("code"),
        newPassword: pw
      });
      setAlert({
        color: "success",
        msg: "Reset della password effettuato con successo! Puoi navigare al login"
      });
    } catch (err) {
      console.log("pw reset error", err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
      setDisabled(false);
    }
  }

  return (
    <Layout>
      <div className="p-4 h-full flex flex-col justify-center items-center">
        <Typography variant="h1" className="mb-2">
          Reset password
        </Typography>

        <p className="text-gray-700 mb-4">
          Ciao <strong>{searchParams.get("callsign")}</strong>, imposta una
          nuova password utilizzando il seguente form
        </p>

        {alert && (
          <Alert
            className="mb-6"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}

        <form action="#" method="post" onSubmit={resetPw}>
          <div className="mb-2 block">
            <Label htmlFor="new-password" value="Nuova password" />
          </div>
          <TextInput
            id="new-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            required
            disabled={disabled}
            value={pw}
            onChange={e => setPw(e.target.value)}
            helperText="Minimo 8 caratteri, almeno un numero e un carattere speciale"
          />
          <div className="my-4" />
          <Button type="submit" disabled={disabled}>
            Reset password
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default ResetPw;
