import axios, { AxiosInstance } from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { parseStringPromise } from "xml2js";
import { JSDOM } from "jsdom";
import { CronJob } from "cron";
import { envs } from "../../shared/envs";
import { logger } from "../../shared/logger";
import { Errors } from "../errors";
import moment from "moment";
import { googleMaps } from "../maps";
import { QthData } from "../maps/interfaces";

interface _RawData {
    call: [string];
    fname: [string];
    name: [string];
    addr2: [string];
    state?: [string];
    country: [string];
}

/**
 * @swagger
 *  components:
 *    schemas:
 *      QrzData:
 *        type: object
 *        required:
 *          - callsign
 *        properties:
 *          callsign:
 *            type: string
 *          firstName:
 *            type: string
 *          lastName:
 *            type: string
 *          address:
 *            type: string
 *          state:
 *            type: string
 *          country:
 *            type: string
 */
interface QrzData {
    callsign: string;
    firstName: string;
    lastName: string;
    address?: string;
    state?: string;
    country: string;
}

/**
 * @swagger
 *  components:
 *    schemas:
 *      QrzInfo:
 *        type: object
 *        required:
 *          - qrz
 *          - qth
 *        properties:
 *          qrz:
 *            $ref: '#/components/schemas/QrzData'
 *          qth:
 *            $ref: '#/components/schemas/QthData'
 */

interface CachedData {
    url?: string;
    date: Date;
    email?: string;
}

interface CachedDataObj {
    [callsign: string]: CachedData;
}

class Qrz {
    private instance: AxiosInstance;
    private xmlInstance: AxiosInstance;
    private key: Promise<string | null>;
    private session: Promise<string | null>;

    private cachedData: CachedDataObj = {};

    constructor() {
        const jar = new CookieJar();
        this.instance = wrapper(
            axios.create({
                withCredentials: true,
                baseURL: "https://www.qrz.com",
                jar,
                headers: {
                    Cookie: `QRZEnabled=1; homestyle=grid; pdfcc=2; QRZ_Cookie_Test=CoK+JSoK;`,
                    "Accept-Encoding": "identity", // Disabilita la compressione
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }
            })
        );
        this.xmlInstance = wrapper(
            axios.create({
                withCredentials: true,
                baseURL: "https://xmldata.qrz.com",
                jar
            })
        );

        this.key = this._loginQrzXML();
        this.session = this._loginQrz();

        // setup cron job to refresh login every day
        new CronJob(
            "0 0 0 * * *",
            () => {
                logger.info("Refreshing QRZ login");
                this._refreshLogin();
            },
            null,
            true,
            "Europe/Rome"
        );
    }

    private _isLoggedIn(): boolean {
        return this.key !== null;
    }

    /**
     * Logs in to QRZ and returns key (null if err)
     */
    private async _loginQrzXML(): Promise<string | null> {
        try {
            const { data } = await this.xmlInstance.get(
                `/xml/current/?username=${envs.QRZ_USERNAME};password=${envs.QRZ_PASSWORD};agent=xcheck`
            );
            const json = await parseStringPromise(data);
            logger.debug("QRZ XML login response:");
            logger.debug(json);

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

    private async _loginQrz(): Promise<string | null> {
        try {
            // first, GET https://www.qrz.com/login HTML and extract 'loginTicket': '<string>',
            // then POST https://www.qrz.com/login with username, password and loginTicket
            // and get xf_session cookie

            const res1 = await this.instance.get("/login");

            // extract by regex 'loginTicket': '<string>'
            const loginTicket = res1.data.match(/'loginTicket': '(.*)'/)?.[1];

            logger.debug("QRZ login ticket: " + loginTicket);

            // create form data
            const formData = new URLSearchParams();
            formData.append("username", envs.QRZ_USERNAME);
            formData.append("password", envs.QRZ_PASSWORD);
            formData.append("loginTicket", loginTicket ?? "");
            formData.append("step", "2");

            const res2 = await this.instance.post(
                "/login",
                formData.toString(),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                }
            );

            // print xf_session cookie
            const cookie = res2.config.jar?.getCookieStringSync(
                "https://www.qrz.com"
            );

            // parse xf_session cookie
            const xfSession = cookie?.match(/xf_session=(.*)/)?.[1];

            logger.debug("QRZ xf_session: " + xfSession);

            return xfSession ?? null;
        } catch (err) {
            logger.error("Error while logging in to qrz.com");
            if (axios.isAxiosError(err)) {
                logger.error(err.response?.data || err.response || err);
            } else {
                logger.error(err);
            }
            return null;
        }
    }

    private async _fetchQrz(
        callsign: string,
        key: string
    ): Promise<_RawData | null> {
        try {
            logger.debug(`QRZ callsign: ${callsign}`);
            const d = Date.parse(new Date().toString());
            const { data } = await this.xmlInstance.get(
                `/xml/current/?s=${key};callsign=${callsign};t=${d}"`
            );
            logger.debug("QRZ raw data:");
            logger.debug(data);
            const json = await parseStringPromise(data);
            if (JSON.stringify(json).includes("Not found:")) {
                logger.debug("Callsign " + callsign + " not found");
                return null;
            }
            return json.QRZDatabase.Callsign[0];
        } catch (err) {
            logger.error("Error while fetching info from qrz.com");
            if (axios.isAxiosError(err)) {
                logger.error(err.response?.data || err.response || err);
            } else {
                logger.error(err);
            }
            return null;
        }
    }

    private _convertRawData(d: _RawData): QrzData {
        const obj: QrzData = {
            callsign: d.call[0],
            firstName: d.fname[0],
            lastName: d.name[0],
            address: d.addr2[0],
            country: d.country[0]
        };
        if (d.state) obj.state = d.state[0];
        return obj;
    }

    private async _fetchPos(_d: _RawData) {
        const d = this._convertRawData(_d);

        if (!d.address && !d.state) {
            logger.debug("Address not found for callsign " + d.callsign);
            return null;
        }

        return await googleMaps.geocode(
            `${d.address} ${d.state || ""} ${d.country}`
        );
    }

    private async _getRawInfo(callsign: string): Promise<_RawData> {
        const key = await this.key;
        if (!key) throw new Error(Errors.QRZ_NO_KEY);

        const om = await this._fetchQrz(callsign, key);
        if (!om) throw new Error(Errors.QRZ_OM_NOT_FOUND);

        return om;
    }

    public async getInfo(callsign: string): Promise<QrzData> {
        const om = await this._getRawInfo(callsign);
        return this._convertRawData(om);
    }

    public async getQth(callsign: string): Promise<QthData | null> {
        const om = await this._getRawInfo(callsign);
        return this._fetchPos(om);
    }

    private _decodeEmail(qmail: string): string {
        let cl = "";
        let dem = "";

        let i = qmail.length - 1;
        for (; i > 0; i--) {
            const c = qmail.charAt(i);
            if (c !== "!") {
                cl = cl.concat(c);
            } else {
                break;
            }
        }
        i--;

        for (let x = 0; x < parseInt(cl); x++) {
            dem = dem.concat(qmail.charAt(i));
            i -= 2;
        }

        return dem;
    }

    private async _getDataForCallsign(
        callsign: string
    ): Promise<CachedData | null> {
        if (!this._isLoggedIn()) {
            logger.warn("QRZ not logged in, skipping");
            return null;
        }
        if (
            callsign in this.cachedData &&
            moment().diff(moment(this.cachedData[callsign].date), "hours") < 3
        ) {
            logger.debug(
                "Returning cached QRZ data: " +
                    this.cachedData[callsign].url +
                    " " +
                    this.cachedData[callsign].email
            );
            return this.cachedData[callsign];
        }

        try {
            const { data } = await this.instance.get("/db/" + callsign, {
                timeout: 5000,
                headers: {
                    Cookie: `xf_session=${await this.session}`
                }
            });
            const dom = new JSDOM(data);

            if (!dom) return null;

            const pic = (
                dom.window.document?.querySelector("#mypic") as HTMLImageElement
            )?.src;

            logger.debug("Scraped QRZ profile pic: " + pic);

            // there will be something like
            // var qmail='4a6faaeebd5t7i7.0g3s0q940u6i6@bodrfd0n1a0s3s8e3l0a!02';
            const qmail = (data as string).match(/var qmail='(.*)';/)?.[1];

            logger.debug("Scraped QRZ qmail: " + qmail);
            const email = qmail ? this._decodeEmail(qmail.trim()) : undefined;
            logger.debug("Decoded QRZ email: " + email);

            this.cachedData[callsign] = {
                date: new Date(),
                url: pic,
                email
            };

            return this.cachedData[callsign];
        } catch (err) {
            logger.error("Error while scraping HTML for callsign " + callsign);
            logger.error(err);
            return null;
        }
    }

    async scrapeProfilePicture(callsign: string): Promise<string | undefined> {
        const data = await this._getDataForCallsign(callsign);
        return data?.url;
    }

    public async scrapeEmail(callsign: string): Promise<string | undefined> {
        const data = await this._getDataForCallsign(callsign);
        return data?.email;
    }

    private async _refreshLogin(): Promise<void> {
        this.key = this._loginQrzXML();
        this.session = this._loginQrz();
    }
}

export const qrz = new Qrz();

export default Qrz;
