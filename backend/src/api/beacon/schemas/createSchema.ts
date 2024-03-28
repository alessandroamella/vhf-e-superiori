import { Schema } from "express-validator";
import { Errors } from "../../errors";

const createSchema: Schema = {
    callsign: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 10 } },
        toUpperCase: { options: [] },
        errorMessage: Errors.INVALID_CALLSIGN,
        custom: {
            // alphanumeric and slash
            options: (value: string) => {
                return /^[A-Z0-9/]*$/.test(value);
            },
            errorMessage: Errors.INVALID_CALLSIGN
        }
    },
    frequency: {
        isNumeric: { options: [] },
        isFloat: { options: [] },
        toFloat: { options: [] },
        errorMessage: Errors.INVALID_FREQUENCY
    },
    qthStr: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 100 } },
        errorMessage: Errors.ERROR_QTH_PARSE
    },
    locator: {
        isString: { options: [] },
        trim: { options: [] },
        errorMessage: Errors.INVALID_LOCATOR
    },
    hamsl: {
        isNumeric: { options: [] },
        isInt: { options: [] },
        toInt: { options: [] },
        errorMessage: Errors.INVALID_HAMSL
    },
    antenna: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 100 } },
        errorMessage: Errors.INVALID_ANTENNA
    },
    mode: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 100 } },
        errorMessage: Errors.INVALID_MODE
    },
    qtf: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 100 } },
        errorMessage: Errors.INVALID_QTF
    },
    power: {
        isNumeric: { options: [] },
        isFloat: { options: [] },
        toFloat: { options: [] },
        errorMessage: Errors.INVALID_POWER
    },
    name: {
        isString: { options: [] },
        trim: { options: [] },
        optional: true,
        errorMessage: Errors.INVALID_NAME
    },
    lat: {
        isNumeric: { options: [] },
        isFloat: { options: [] },
        toFloat: { options: [] },
        optional: true,
        errorMessage: Errors.INVALID_LATITUDE
    },
    lon: {
        isNumeric: { options: [] },
        isFloat: { options: [] },
        toFloat: { options: [] },
        optional: true,
        errorMessage: Errors.INVALID_LONGITUDE
    }
};
export default createSchema;
