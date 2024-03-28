import { Schema } from "express-validator";
import { Errors } from "../../errors";

const createSchema: Schema = {
    forPost: {
        trim: { options: [] },
        isMongoId: { options: [] },
        errorMessage: Errors.INVALID_OBJECT_ID
    },
    content: {
        trim: { options: [] },
        isLength: { options: { min: 1, max: 300 } },
        errorMessage: Errors.INVALID_CONTENT
    }
};
export default createSchema;
