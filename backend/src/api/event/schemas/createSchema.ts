import { Schema } from "express-validator";
import { JSDOM } from "jsdom";
import DOMPurify, { WindowLike } from "dompurify";

const createSchema: Schema = {
    name: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1 } }
    },
    description: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1 } },
        optional: true,
        customSanitizer: {
            options: v => {
                const window = new JSDOM("").window;
                const purify = DOMPurify(window as unknown as WindowLike);
                return purify.sanitize(v, { USE_PROFILES: { html: true } });
            }
        }
    },
    band: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1 } }
    },
    date: {
        isISO8601: { options: [] },
        trim: { options: [] }
    },
    logoUrl: {
        trim: { options: [] },
        // isURL: { options: [] },
        optional: true
    },
    eqslUrl: {
        trim: { options: [] },
        // isURL: { options: [] },
        optional: true
    },
    joinStart: {
        isISO8601: { options: [] },
        trim: { options: [] }
    },
    joinDeadline: {
        isISO8601: { options: [] },
        trim: { options: [] }
    },
    offsetCallsign: {
        isInt: true,
        optional: true
    },
    offsetData: {
        isInt: true,
        optional: true
    },
    offsetFrom: {
        isInt: true,
        optional: true
    }
};
export default createSchema;
