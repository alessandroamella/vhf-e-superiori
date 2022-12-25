import "./db";
import "./auth";
import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./auth/routes";
import passport from "passport";
import { logger, LoggerStream } from "../shared/logger";
import { envs } from "../shared/envs";
import { specs } from "./docs/specs";
import checkMalformedBody from "./middlewares/checkMalformedBody";
import errorHandler from "./middlewares/errorHandler";
import populateUser from "./middlewares/populateUser";
import { UserDoc } from "./user/models";

declare global {
    namespace Express {
        interface User extends UserDoc {}
        interface Request {
            // qsl?: QslDoc;
        }
    }
}

const app = express();

app.use(morgan("dev", { stream: new LoggerStream() }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieParser(envs.COOKIE_SECRET));

app.use(passport.initialize());

if (process.env.NODE_ENV !== "production") {
    app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(specs, { explorer: true })
    );
}

app.use("/auth", authRoutes);
// app.use(
//     "/qsl",
//     passport.authenticate("jwt", { session: false }),
//     populateUser,
//     qslRoutes
// );
// app.use(
//     "/qrz",
//     passport.authenticate("jwt", { session: false }),
//     populateUser,
//     qrzRoutes
// );

app.use(checkMalformedBody);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
const IP = process.env.IP || "127.0.0.1";
app.listen(PORT, IP, () => {
    logger.info(`Server started on ${IP}:${PORT}`);
});
