import swaggerJsdoc from "swagger-jsdoc";
import { logger } from "../../shared/logger";

export const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Radio event manager",
      version: "1.0.0",
      description: "Radio event manager by Bitrey IU4QSG",
    },
    servers: [
      {
        url: "http://localhost:3000/",
        description: "API documentation",
      },
    ],
  },
  apis: ["**/*.ts"],
};

logger.info(`APIs path at "${options.apis.join('", "')}"`);

export const specs = swaggerJsdoc(options);
