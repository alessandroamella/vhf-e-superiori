import { Schema } from "express-validator";

const createSchema: Schema = {
    description: {
        isString: { options: [] },
        isLength: { options: { min: 1, max: 300 } }
    }
};
export default createSchema;
