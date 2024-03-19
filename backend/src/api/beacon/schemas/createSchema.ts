import { Schema } from "express-validator";

const createSchema: Schema = {
    callsign: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 10 } },
        toUpperCase: { options: [] },
        isAlphanumeric: { options: [] },
        errorMessage:
            "Callsign must be between 1 and 10 alphanumeric characters"
    },
    frequency: {
        isNumeric: { options: [] },
        isFloat: { options: [] },
        toFloat: { options: [] },
        errorMessage: "Frequency must be a number"
    },
    qthStr: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 100 } },
        errorMessage: "QTH must be between 1 and 100 characters"
    },
    locator: {
        isString: { options: [] },
        trim: { options: [] },
        errorMessage: "Locator must be a string"
    },
    hamsl: {
        isNumeric: { options: [] },
        isInt: { options: [] },
        toInt: { options: [] },
        errorMessage: "Height above mean sea level must be a number"
    },
    antenna: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 100 } },
        errorMessage: "Antenna must be between 1 and 100 characters"
    },
    mode: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 100 } },
        errorMessage: "Mode must be between 1 and 100 characters"
    },
    qtf: {
        isString: { options: [] },
        trim: { options: [] },
        isLength: { options: { min: 1, max: 100 } },
        errorMessage: "QTF must be between 1 and 100 characters"
    },
    power: {
        isNumeric: { options: [] },
        isFloat: { options: [] },
        toFloat: { options: [] },
        errorMessage: "Power must be a number"
    },
    name: {
        isString: { options: [] },
        trim: { options: [] },
        optional: true,
        errorMessage: "Name must be a string"
    },
    lat: {
        isNumeric: { options: [] },
        isFloat: { options: [] },
        toFloat: { options: [] },
        optional: true,
        errorMessage: "Latitude must be a number"
    },
    lon: {
        isNumeric: { options: [] },
        isFloat: { options: [] },
        toFloat: { options: [] },
        optional: true,
        errorMessage: "Longitude must be a number"
    }
};
export default createSchema;
