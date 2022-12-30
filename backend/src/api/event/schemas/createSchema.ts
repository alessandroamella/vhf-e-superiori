import { Schema } from "express-validator";

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
        optional: true
    },
    date: {
        isISO8601: { options: [] },
        trim: { options: [] }
    },
    logoUrl: {
        trim: { options: [] },
        isURL: { options: [] },
        optional: true
    },
    joinDeadline: {
        isISO8601: { options: [] },
        trim: { options: [] }
    }
};
export default createSchema;
