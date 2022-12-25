/**
 * @swagger
 *  components:
 *    schemas:
 *      ResErr:
 *        type: object
 *        required:
 *          - err
 *        properties:
 *          err:
 *            type: string
 *            description: Error message
 */

export enum Errors {
    USER_NOT_FOUND = "USER_NOT_FOUND",
    INVALID_PW = "INVALID_PW",
    DOC_NOT_FOUND = "DOC_NOT_FOUND",
    SERVER_ERROR = "SERVER_ERROR",
    LOGIN_TOKEN_EXPIRED = "LOGIN_TOKEN_EXPIRED",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    MISSING_ENV = "MISSING_ENV",
    ALREADY_REGISTERED = "ALREADY_REGISTERED",
    QRZ_NO_KEY = "QRZ_NO_KEY",
    QRZ_OM_NOT_FOUND = "QRZ_OM_NOT_FOUND",
    QTH_NOT_FOUND = "QTH_NOT_FOUND",
    INVALID_OBJECT_ID = "INVALID_OBJECT_ID",
    QSL_CREATE_ERROR = "QSL_CREATE_ERROR",
    QSL_NOT_FOUND = "QSL_NOT_FOUND",
    QSL_NOT_OWNED = "QSL_NOT_OWNED",
    INVALID_LOGIN = "INVALID_LOGIN",
    MALFORMED_REQUEST_BODY = "MALFORMED_REQUEST_BODY"
}
