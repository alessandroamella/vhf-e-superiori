import { Typography } from "@material-tailwind/react";
import axios from "axios";
import { Alert, Button, Label, TextInput } from "flowbite-react";
import { useState } from "react";
import { Helmet } from "react-helmet";
import { Trans, useTranslation } from "react-i18next";
import { createSearchParams, useNavigate, useSearchParams } from "react-router";
import { getErrorStr } from "../shared";

const ResetPw = () => {
  const [pw, setPw] = useState("");
  const [alert, setAlert] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const { t } = useTranslation();

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  async function resetPw(e) {
    e.preventDefault();

    setDisabled(true);
    try {
      await axios.post("/api/auth/resetpw", {
        user: searchParams.get("user"),
        passwordResetCode: searchParams.get("code"),
        newPassword: pw,
      });

      navigate({
        pathname: "/login",
        search: createSearchParams({
          alert: true,
        }).toString(),
      });
    } catch (err) {
      console.log("pw reset error", err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
      setDisabled(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>{t("vhfResetPassword")}</title>
      </Helmet>
      <div className="p-4 h-full flex flex-col justify-center items-center">
        <Typography variant="h1" className="dark:text-white mb-2">
          {t("resetPasswordTitle")}
        </Typography>

        <p className="text-gray-700 mb-4">
          <Trans
            i18nKey="resetPasswordMessage"
            values={{ callsign: searchParams.get("callsign") }}
          />
        </p>

        {alert && (
          <Alert
            className="mb-6 dark:text-black"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}

        <form action="#" method="post" onSubmit={resetPw}>
          <div className="mb-2 block">
            <Label htmlFor="new-password" value={t("newPassword")} />
          </div>
          <TextInput
            id="new-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            required
            disabled={disabled}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            helperText={t("newPasswordHelper")}
          />
          <div className="my-4" />
          <Button type="submit" disabled={disabled}>
            {t("resetPasswordTitle")}
          </Button>
        </form>
      </div>
    </>
  );
};

export default ResetPw;
