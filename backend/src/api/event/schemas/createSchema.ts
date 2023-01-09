import { Schema } from "express-validator";
import DOMPurify from "dompurify";

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
            options: v =>
                DOMPurify.sanitize(v, { USE_PROFILES: { html: true } })
        }
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
    joinDeadline: {
        isISO8601: { options: [] },
        trim: { options: [] }
    }
};
export default createSchema;
