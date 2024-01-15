import { Schema } from "express-validator";

const createSchema: Schema = {
    forPost: {
        trim: { options: [] },
        isMongoId: { options: [] },
        errorMessage: "Invalid post ID"
    },
    content: {
        trim: { options: [] },
        isLength: { options: { min: 1, max: 300 } },
        errorMessage: "Invalid content"
    }
};
export default createSchema;
