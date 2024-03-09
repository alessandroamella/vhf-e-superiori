import { QsoDoc } from "../qso/models";

/**
 * @swagger
 *  components:
 *    schemas:
 *      Ranking:
 *        type: object
 *        required:
 *          - callsign
 *          - qsos
 *        properties:
 *          callsign:
 *            type: string
 *            description: The callsign of the station
 *            minLength: 1
 *            maxLength: 10
 *            example: IU4QSG
 *          qsos:
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/Qso'
 */
export interface Ranking {
    callsign: string;
    qsos: QsoDoc[];
}
