import { Schema } from "express-validator";
import { isValidPhoneNumber } from "libphonenumber-js";
import { Errors } from "../../errors";

const createSchema: Schema = {
    callsign: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 10 } },
        toUpperCase: { options: [] },
        isAlphanumeric: { options: [] }
    },
    name: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 50 } }
    },
    email: {
        isString: { options: [] },
        trim: { options: [] },
        isEmail: { options: [], errorMessage: Errors.INVALID_EMAIL },
        toLowerCase: { options: [] }
    },
    phoneNumber: {
        isString: { options: [] },
        trim: { options: [] },
        custom: {
            options: v => isValidPhoneNumber(v),
            errorMessage: Errors.INVALID_PHONE_NUMBER
        }
    },
    password: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 8, max: 64 } },
        isStrongPassword: {
            options: [{ minLength: 8 }],
            errorMessage: Errors.WEAK_PW
        }
    }
};
export default createSchema;
