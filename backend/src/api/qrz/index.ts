import axios, { AxiosInstance } from "axios";
import { parseStringPromise } from "xml2js";
import { envs } from "../../shared/envs";
import { logger } from "../../shared/logger";
import { Errors } from "../errors";

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
interface Data {
    callsign: string;
    firstName: string;
    lastName: string;
    address: string;
    state?: string;
    country: string;
}

/**
 * @swagger
 *  components:
 *    schemas:
 *      QthData:
 *        type: object
 *        properties:
 *          latitude:
 *            type: string
 *          longitude:
 *            type: string
 *          type:
 *            type: string
 *          name:
 *            type: string
 *          number:
 *            type: number
 *          postal_code:
 *            type: string
 *          street:
 *            type: string
 *          confidence:
 *            type: number
 *          region:
 *            type: string
 *          region_code:
 *            type: string
 *          county:
 *            type: string
 *          locality:
 *            type: string
 *          administrative_area:
 *            type: string
 *          neighbourhood:
 *            type: string
 *          country:
 *            type: string
 *          country_code:
 *            type: string
 *          continent:
 *            type: string
 *          label:
 *            type: string
 */
// interface Qth {
//     latitude: number;
//     longitude: number;
//     type: string;
//     name: string;
//     number?: any;
//     postal_code?: any;
//     street?: any;
//     confidence: number;
//     region: string;
//     region_code: string;
//     county?: any;
//     locality: string;
//     administrative_area: string;
//     neighbourhood?: any;
//     country: string;
//     country_code: string;
//     continent: string;
//     label: string;
// }

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
 */

// DEBUG rimosso
// *          qth:
// *            $ref: '#/components/schemas/QthData'
interface QrzInfo {
    qrz: Data;
    // qth: Qth;
}

class Qrz {
    private instance: AxiosInstance;
    private key: Promise<string | null>;

    constructor() {
        this.instance = axios.create({
            withCredentials: true,
            baseURL: "https://xmldata.qrz.com"
        });

        this.key = this._loginQrz();
    }

    /**
     * Logs in to QRZ and returns key (null if err)
     */
    private async _loginQrz(): Promise<string | null> {
        try {
            const { data } = await this.instance.get(
                `/xml/current/?username=${envs.QRZ_USERNAME};password=${envs.QRZ_PASSWORD};agent=xcheck`
            );
            const json = await parseStringPromise(data);
            return json.QRZDatabase.Session[0].Key[0];
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
            const { data } = await this.instance.get(
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

    private _convertRawData(d: _RawData): Data {
        const obj: Data = {
            callsign: d.call[0],
            firstName: d.fname[0],
            lastName: d.name[0],
            address: d.addr2[0],
            country: d.country[0]
        };
        if (d.state) obj.state = d.state[0];
        return obj;
    }

    // private async _fetchPos(_d: _RawData): Promise<any | null> {
    //     const d = this._convertRawData(_d);

    //     try {
    //         logger.info(
    //             `Positionstack q: ${d.address} ${d.state || ""} ${d.country}`
    //         );
    //         const qthReq = await axios.get(
    //             "http://api.positionstack.com/v1/forward",
    //             {
    //                 params: {
    //                     access_key: envs.POSITIONSTACK_KEY,
    //                     query: `${d.address} ${d.state || ""} ${d.country}`
    //                 }
    //             }
    //         );

    //         return qthReq.data.data[0];
    //     } catch (err) {
    //         logger.error("Error while fetching info from Positionstack");
    //         if (axios.isAxiosError(err)) {
    //             logger.error(err.response?.data || err.response || err);
    //         } else {
    //             logger.error(err as any);
    //         }
    //         return null;
    //     }
    // }

    async getInfo(callsign: string): Promise<QrzInfo> {
        const key = await this.key;
        if (!key) throw new Error(Errors.QRZ_NO_KEY);

        const om = await this._fetchQrz(callsign, key);
        if (!om) throw new Error(Errors.QRZ_OM_NOT_FOUND);

        // const qth = await this._fetchPos(om);
        // if (!qth) throw new Error(Errors.QTH_NOT_FOUND);

        return {
            qrz: this._convertRawData(om)
            // qth
        };
    }
}

export default Qrz;
