import { Schema } from "express-validator";

const updateSchema: Schema = {
    name: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 50 } }
    },
    email: {
        isString: { options: [] },
        trim: { options: [] },
        isEmail: { options: [] }
    }
};
export default updateSchema;
