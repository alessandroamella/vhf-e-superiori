import { Schema } from "express-validator";
import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js";
import { Errors } from "../../errors";
import { logger } from "../../../shared";

const createSchema: Schema = {
    callsign: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 10 } },
        toUpperCase: { options: [] },
        isAlphanumeric: { options: [] },
        errorMessage: Errors.INVALID_CALLSIGN
    },
    name: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 50 } },
        errorMessage: Errors.INVALID_NAME
    },
    email: {
        isString: { options: [] },
        trim: { options: [] },
        isEmail: { options: [], errorMessage: Errors.INVALID_EMAIL },
        toLowerCase: { options: [] },
        errorMessage: Errors.INVALID_EMAIL
    },
    phoneNumber: {
        isString: { options: [] },
        trim: { options: [] },
        custom: {
            options: v => isValidPhoneNumber(v, "IT"),
            errorMessage: Errors.INVALID_PHONE_NUMBER
        },
        customSanitizer: {
            options: v => {
                try {
                    return parsePhoneNumber(v, "IT")!.formatInternational();
                } catch (err) {
                    logger.debug("Error while parsing phone number: " + err);
                    return v;
                }
            }
        }
    },
    password: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 8, max: 64 } },
        isStrongPassword: {
            options: [{ minLength: 8, minSymbols: 0 }],
            errorMessage: Errors.WEAK_PW
        },
        errorMessage: Errors.WEAK_PW
    },
    address: {
        isString: { options: [] },
        trim: { options: [] },
        optional: true,
        errorMessage: Errors.INVALID_LOCATION
    },
    lat: {
        isFloat: { options: [] },
        optional: true,
        errorMessage: Errors.INVALID_LOCATION
    },
    lon: {
        isFloat: { options: [] },
        optional: true,
        errorMessage: Errors.INVALID_LOCATION
    },
    city: {
        isString: { options: [] },
        trim: { options: [] },
        optional: true,
        errorMessage: Errors.INVALID_LOCATION
    },
    province: {
        isString: { options: [] },
        trim: { options: [] },
        optional: true,
        errorMessage: Errors.INVALID_LOCATION
    }
};
export default createSchema;
