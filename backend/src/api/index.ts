import "./db";
import "./auth";
import { logger } from "../shared/logger";
import { createServer } from "./utils";

const app = createServer();

const PORT = Number(process.env.PORT) || 3000;
const IP = process.env.IP || "127.0.0.1";
app.listen(PORT, IP, () => {
    logger.info(`Server started on ${IP}:${PORT}`);
});
