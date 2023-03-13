import { Schema } from "express-validator";
import { Errors } from "../../errors";

const createSchema: Schema = {
    fromUser: {
        isString: { options: [] },
        isLength: { options: { min: 1 } },
        isMongoId: { options: [] },
        errorMessage: Errors.INVALID_OBJECT_ID
    },
    description: {
        isString: { options: [] },
        isLength: { options: { min: 1 } }
    },
    band: {
        isString: { options: [] },
        isIn: { options: [["144", "432", "1200"]] },
        errorMessage: Errors.INVALID_FREQUENCY_BAND
    },
    brand: {
        isString: { options: [] },
        isLength: { options: { min: 0, max: 30 } }
    },
    isSelfBuilt: {
        isBoolean: { options: {} }
    },
    metersFromSea: {
        isFloat: { options: { max: 10000 } }
    },
    boomLengthCm: {
        isFloat: { options: { min: 0, max: 100000 } }
    },
    numberOfElements: {
        isInt: { options: { min: 1, max: 300 } }
    },
    numberOfAntennas: {
        isInt: { options: { min: 0, max: 100 } }
    },
    cable: {
        isString: { options: [] },
        isLength: { options: { max: 100 } }
    },
    pictures: {
        isArray: { options: { min: 1, max: 5 } }
    },
    "pictures.*": {
        isString: { options: [] }
    },
    videos: {
        isArray: { options: { min: 0, max: 2 } }
    },
    "videos.*": {
        isString: { options: [] }
    },
    isApproved: {
        isBoolean: { options: [] }
    }
};
export default createSchema;
