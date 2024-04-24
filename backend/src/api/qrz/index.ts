/* eslint-disable @typescript-eslint/no-non-null-assertion */
import axios, { AxiosInstance } from "axios";
import { parseStringPromise } from "xml2js";
import { CronJob } from "cron";
import { envs } from "../../shared/envs";
import { logger } from "../../shared/logger";
import { OkQrzDatabase, QrzMappedData, QrzReturnData } from "./interfaces/qrz";

interface CachedData {
    url?: string;
    date: Date;
    email?: string;
    name?: string;
    address?: string;
}

interface CachedDataObj {
    [callsign: string]: CachedData;
}

class Qrz {
    private xmlInstance: AxiosInstance;
    private key: Promise<string | null>;

    private cachedData: CachedDataObj = {};

    constructor() {
        this.xmlInstance = axios.create({
            withCredentials: true,
            baseURL: "https://xmldata.qrz.com"
        });

        this.key = this._loginQrzXML();

        // setup cron job to refresh login every 30 minutes
        new CronJob(
            "0 */30 * * * *",
            () => {
                logger.info("Refreshing QRZ login");
                this._refreshLogin();
            },
            null,
            true,
            "Europe/Rome"
        );
    }

    /**
     * Logs in to QRZ and returns key (null if err)
     */
    private async _loginQrzXML(): Promise<string | null> {
        try {
            const { data } = await this.xmlInstance.get("/xml/current/", {
                params: {
                    username: envs.QRZ_USERNAME,
                    password: envs.QRZ_PASSWORD
                    // agent: "xcheck"
                },
                timeout: 10000 // 10 seconds
            });
            const json = await parseStringPromise(data);
            logger.debug("QRZ XML login response:");
            logger.debug(json);

            if ("Error" in json.QRZDatabase.Session[0]) {
                logger.error("Error in qrz.com login response");
                logger.error(
                    json.QRZDatabase.Session[0].Error[0] ||
                        json.QRZDatabase.Session[0].Error
                );
                return null;
            }

            logger.info("Logged in to QRZ XML");
            logger.debug(
                "Logged in with key: " +
                    this.getProp(json.QRZDatabase.Session[0].Key)
            );

            return json.QRZDatabase.Session[0].Key[0];
        } catch (err) {
            logger.error("Error while logging in to XML qrz.com");
            if (axios.isAxiosError(err)) {
                logger.error(err.response?.data || err.response || err);
            } else {
                logger.error(err);
            }
            return null;
        }
    }

    private _isLoggedIn(): boolean {
        return this.key !== null;
    }

    private async _refreshLogin(): Promise<void> {
        this.key = this._loginQrzXML();
    }

    private getProp<T = unknown>(prop: T[] | undefined): T | undefined {
        return Array.isArray(prop) ? prop[0] : undefined;
    }

    public async getInfo(
        callsign: string,
        alreadyCalled = false
    ): Promise<QrzMappedData | null> {
        if (!this._isLoggedIn()) {
            logger.warn("QRZ login expired, refreshing");
            await this._refreshLogin();
        }

        let json: QrzReturnData | null = null;
        try {
            logger.debug(`QRZ callsign: ${callsign}`);
            const d = Date.parse(new Date().toString());
            const { data } = await this.xmlInstance.get("/xml/current/", {
                params: {
                    s: await this.key,
                    callsign: callsign,
                    t: d
                },
                timeout: 2000 // 10 seconds
            });
            // logger.debug("QRZ raw data:");
            // logger.debug(data);
            const parsed: QrzReturnData = await parseStringPromise(data);
            json = parsed;

            if ("Error" in parsed.QRZDatabase.Session[0]) {
                if (alreadyCalled) {
                    logger.error(
                        "Error alreadyCalled while fetching info from qrz.com"
                    );
                    logger.error(parsed.QRZDatabase.Session[0].Error);
                    return null;
                }

                const err = this.getProp(parsed.QRZDatabase.Session[0].Error);
                if (err?.includes("Not found")) {
                    logger.debug(`Callsign ${callsign} not found on QRZ`);
                    return null;
                } else if (err?.includes("Session Timeout")) {
                    logger.warn("QRZ session timeout, refreshing");
                    await this._refreshLogin();
                    return this.getInfo(callsign, true);
                } else if (err?.includes("Invalid session key")) {
                    logger.warn("QRZ invalid session key, refreshing");
                    await this._refreshLogin();
                    return this.getInfo(callsign, true);
                }
                logger.error("QRZ error:");
                logger.error(
                    err ||
                        parsed.QRZDatabase.Session[0].Error[0] ||
                        parsed.QRZDatabase.Session[0]
                );
                return null;
            }
            const info = this.getProp(
                (parsed.QRZDatabase as OkQrzDatabase).Callsign
            )!;
            logger.debug("QRZ info:");
            logger.debug(info);
            return {
                callsign: this.getProp(info.call) || callsign,
                name:
                    this.getProp(info.name_fmt) ||
                    `${this.getProp(info.fname)} ${this.getProp(info.name)}`,
                email: this.getProp(info.email),
                address:
                    (
                        (this.getProp(info.addr1) || "") +
                        " " +
                        (this.getProp(info.addr2) || "")
                    ).trim() || undefined,
                town: this.getProp(info.addr2),
                country: this.getProp(info.country),
                lat: this.getProp(info.lat)
                    ? parseFloat(this.getProp(info.lat)!)
                    : undefined,
                lon: this.getProp(info.lon)
                    ? parseFloat(this.getProp(info.lon)!)
                    : undefined,
                locator: this.getProp(info.grid),
                pictureUrl: this.getProp(info.image),
                zip: this.getProp(info.zip)
            };
        } catch (err) {
            logger.error("Error while fetching info from qrz.com");
            if (axios.isAxiosError(err)) {
                logger.error(err.response?.data || err.response || err);
            } else {
                logger.error(err);
            }
            if (json) {
                logger.error("JSON was:");
                logger.error(json);
            }
            return null;
        }
    }
}

export const qrz = new Qrz();

export default Qrz;
