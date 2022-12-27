import { Schema } from "express-validator";

const createSchema: Schema = {
    antenna: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1 } }
    },
    forEvent: {
        trim: { options: [] },
        isMongoId: { options: [] }
    }
};
export default createSchema;
