import express from "express";
import { NOT_FOUND } from "http-status";
import swaggerUi from "swagger-ui-express";
import { specs } from "../docs/specs";
import { Errors } from "../errors";
import { createError } from "../helpers";
import apiRoutes from "./apiRoutes";

export function createServer() {
  const app = express();

  if (process.env.NODE_ENV !== "production") {
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(specs, { explorer: true }),
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

  app.use("*", (_req, res) =>
    res.status(NOT_FOUND).json(createError(Errors.URL_NOT_FOUND)),
  );

  return app;
}
