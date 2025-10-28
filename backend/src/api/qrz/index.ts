import axios, { AxiosInstance, isAxiosError } from "axios";
import { CronJob } from "cron";
import moment from "moment-timezone";
import { parseStringPromise } from "xml2js";
import { envs } from "../../shared/envs";
import { logger } from "../../shared/logger";
import { telegramService } from "../telegram/telegram.service";
import { OkQrzDatabase, QrzMappedData, QrzReturnData } from "./interfaces/qrz";

interface CachedData {
  data: QrzMappedData;
  expiry: moment.Moment;
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
      baseURL: "https://xmldata.qrz.com",
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
      "Europe/Rome",
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
          password: envs.QRZ_PASSWORD,
          // agent: "xcheck"
        },
        timeout: 10000, // 10 seconds
      });
      const json = await parseStringPromise(data);
      logger.debug("QRZ XML login response:");
      logger.debug(json);

      if ("Error" in json.QRZDatabase.Session[0]) {
        logger.error("Error in qrz.com login response");
        logger.error(
          json.QRZDatabase.Session[0].Error[0] ||
            json.QRZDatabase.Session[0].Error,
        );
        return null;
      }

      logger.info("Logged in to QRZ XML");
      logger.debug(
        `Logged in with key: ${this.getProp(json.QRZDatabase.Session[0].Key)}`,
      );

      return json.QRZDatabase.Session[0].Key[0];
    } catch (err) {
      logger.error("Error while logging in to XML qrz.com");
      logger.error(
        (axios.isAxiosError(err) && (err.response?.data || err.response)) ||
          err?.toString(),
      );
      telegramService.sendAdminNotification(
        `❗️ <b>Error logging in to QRZ XML API</b>\n\n${
          isAxiosError(err)
            ? typeof err.response?.data === "object"
              ? JSON.stringify(err.response.data)
              : err.message
            : err instanceof Error
              ? err.message
              : "Unknown error"
        }`,
        envs.TELEGRAM_ERRORS_THREAD_ID,
      );
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
    alreadyCalled = false,
  ): Promise<QrzMappedData | null> {
    if (!this._isLoggedIn()) {
      logger.warn("QRZ login expired, refreshing");
      await this._refreshLogin();
    }

    // **Cache Logic Start**
    const cachedEntry = this.cachedData[callsign.toUpperCase()];
    if (cachedEntry) {
      if (moment().isBefore(cachedEntry.expiry)) {
        logger.debug(`Cache hit for ${callsign}`);
        return cachedEntry.data;
      } else {
        logger.debug(`Cache expired for ${callsign}, refreshing`);
        delete this.cachedData[callsign.toUpperCase()];
      }
    }
    // **Cache Logic End**

    let json: QrzReturnData | null = null;
    try {
      logger.debug(`QRZ callsign: ${callsign}`);
      const d = moment().valueOf();
      const { data } = await this.xmlInstance.get("/xml/current/", {
        params: {
          s: await this.key,
          callsign: callsign,
          t: d,
        },
        timeout: 2000, // 10 seconds
      });
      const parsed: QrzReturnData = await parseStringPromise(data);
      json = parsed;

      if ("Error" in parsed.QRZDatabase.Session[0]) {
        if (alreadyCalled) {
          logger.error("Error alreadyCalled while fetching info from qrz.com");
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
            parsed.QRZDatabase.Session[0],
        );
        return null;
      }
      const info = this.getProp(
        (parsed.QRZDatabase as OkQrzDatabase).Callsign,
      )!;
      logger.debug("QRZ info:");
      logger.debug(info);
      const mappedData: QrzMappedData = {
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
        zip: this.getProp(info.zip),
      };

      // **Cache Storage**
      this.cachedData[callsign.toUpperCase()] = {
        data: mappedData,
        expiry: moment().add(1, "hour"),
      };
      logger.debug(
        `Cached data for ${callsign} (email: ${mappedData.email || "--none--"}) until ${this.cachedData[
          callsign.toUpperCase()
        ].expiry.format()}`,
      );

      return mappedData;
    } catch (err) {
      logger.error("Error while fetching info from qrz.com");
      if (axios.isAxiosError(err)) {
        logger.error(
          err.response?.data || err.response || err.code || err.message,
        );
      } else {
        logger.error((err as Error)?.message || err);
      }
      if (json) {
        logger.error("JSON was:");
        logger.error(json);
      }
      telegramService.sendAdminNotification(
        `❗️ <b>Error fetching QRZ info for callsign ${callsign}</b>\n\n${
          isAxiosError(err)
            ? typeof err.response?.data === "object"
              ? JSON.stringify(err.response.data)
              : err.message
            : err instanceof Error
              ? err.message
              : "Unknown error"
        }`,
        envs.TELEGRAM_ERRORS_THREAD_ID,
      );
      return null;
    }
  }
}

export const qrz = new Qrz();

export default Qrz;
