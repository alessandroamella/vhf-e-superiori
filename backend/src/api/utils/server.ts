import express from "express";
import swaggerUi from "swagger-ui-express";
import apiRoutes from "./apiRoutes";
import { specs } from "../docs/specs";

export function createServer() {
    const app = express();

    if (process.env.NODE_ENV !== "production") {
        app.use(
            "/api-docs",
            swaggerUi.serve,
            swaggerUi.setup(specs, { explorer: true })
        );
    }

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

    // app.use("*", (req, res) =>
    //     res.status(NOT_FOUND).json(createError(Errors.URL_NOT_FOUND))
    // );

    return app;
}
