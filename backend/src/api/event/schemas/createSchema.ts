import { Schema } from "express-validator";

const createSchema: Schema = {
    name: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1 } }
    },
    date: {
        isISO8601: { options: [] },
        trim: { options: [] }
    },
    joinDeadline: {
        isISO8601: { options: [] },
        trim: { options: [] }
    }
};
export default createSchema;
