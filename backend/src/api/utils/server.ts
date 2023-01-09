import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import apiRoutes from "./apiRoutes";
import { LoggerStream } from "../../shared/logger";
import { envs } from "../../shared/envs";
import { specs } from "../docs/specs";
import checkMalformedBody from "../middlewares/checkMalformedBody";
import errorHandler from "../middlewares/errorHandler";
import { NOT_FOUND } from "http-status";
import populateUser from "../middlewares/populateUser";

export function createServer() {
    const app = express();

    app.use(morgan("dev", { stream: new LoggerStream() }));

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.use(cookieParser(envs.COOKIE_SECRET));

    if (process.env.NODE_ENV !== "production") {
        app.use(
            "/api-docs",
            swaggerUi.serve,
            swaggerUi.setup(specs, { explorer: true })
        );
    }

    app.use(populateUser);

    app.use("/api", apiRoutes);
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

    app.use("*", (req, res) => res.sendStatus(NOT_FOUND));

    return app;
}
