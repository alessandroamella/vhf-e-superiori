import { Schema } from "express-validator";
import { Errors } from "../../errors";

const createSchema: Schema = {
  fromStation: {
    isString: { options: [] },
    trim: { options: [] },
    isMongoId: { options: [] },
    optional: true,
  },
  fromStationCallsignOverride: {
    isString: { options: [] },
    trim: { options: [] },
    isLength: { options: { min: 1, max: 10 } },
    toUpperCase: { options: [] },
    // TODO add prefix and suffix support
    // isAlphanumeric: { options: [] },
    errorMessage: Errors.INVALID_CALLSIGN,
    optional: true,
  },
  callsign: {
    isString: { options: [] },
    trim: { options: [] },
    isLength: { options: { min: 1, max: 10 } },
    toUpperCase: { options: [] },
    // TODO add prefix and suffix support
    // isAlphanumeric: { options: [] },
    errorMessage: Errors.INVALID_CALLSIGN,
  },
  email: {
    isString: { options: [] },
    trim: { options: [] },
    isEmail: { options: [] },
    optional: true,
    errorMessage: Errors.INVALID_EMAIL,
  },
  event: {
    isString: { options: [] },
    trim: { options: [] },
    isMongoId: { options: [] },
    errorMessage: Errors.INVALID_OBJECT_ID,
  },
  frequency: {
    isNumeric: { options: [] },
    toFloat: { options: [] },
    isFloat: { options: [] },
    errorMessage: Errors.INVALID_FREQUENCY,
    optional: true,
  },
  band: {
    isString: { options: [] },
    trim: { options: [] },
  },
  mode: {
    isString: { options: [] },
    trim: { options: [] },
    toUpperCase: { options: [] },
    isLength: { options: { min: 1, max: 10 } },
    errorMessage: Errors.INVALID_MODE,
  },
  qsoDate: {
    isString: { options: [] },
    trim: { options: [] },
    isISO8601: { options: [] },
    errorMessage: Errors.INVALID_DATE,
  },
  notes: {
    isString: { options: [] },
    trim: { options: [] },
    optional: true,
    errorMessage: Errors.INVALID_NOTES,
  },
  locator: {
    isString: { options: [] },
    trim: { options: [] },
    optional: true,
    errorMessage: Errors.INVALID_LOCATOR,
  },
  rst: {
    isNumeric: { options: [] },
    toInt: { options: [] },
    isInt: { options: [] },
    optional: true,
    errorMessage: Errors.INVALID_RST,
  },
  fromStationCity: {
    isString: { options: [] },
    trim: { options: [] },
    optional: true,
    errorMessage: Errors.INVALID_CITY,
  },
  fromStationProvince: {
    isString: { options: [] },
    trim: { options: [] },
    optional: true,
    errorMessage: Errors.INVALID_PROVINCE,
  },
  fromStationLat: {
    isNumeric: { options: [] },
    toFloat: { options: [] },
    isFloat: { options: [] },
    optional: true,
    errorMessage: Errors.INVALID_LATITUDE,
  },
  fromStationLon: {
    isNumeric: { options: [] },
    toFloat: { options: [] },
    isFloat: { options: [] },
    optional: true,
    errorMessage: Errors.INVALID_LONGITUDE,
  },
};
export default createSchema;
