import {
  DocumentType,
  modelOptions,
  pre,
  prop,
  Severity,
} from "@typegoose/typegoose";
import bcrypt from "bcrypt";
import IsEmail from "isemail";
import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js";
import { logger } from "../../../shared";

export class PasswordReset {
  @prop({ required: true })
  public code!: string;

  @prop({ required: true })
  public expires!: Date;
}

/**
 * @swagger
 *  components:
 *    schemas:
 *      PasswordReset:
 *        type: object
 *        required:
 *          - code
 *          - expires
 *        properties:
 *          code:
 *            type: string
 *            description: Password reset code
 *          expires:
 *            type: string
 *            format: date-time
 *            description: When the password reset code expires
 *      User:
 *        type: object
 *        required:
 *          - callsign
 *          - name
 *          - email
 *          - phoneNumber
 *          - password
 *          - isAdmin
 *        properties:
 *          callsign:
 *            type: string
 *            minLength: 1
 *            maxLength: 10
 *            description: Callsign without prefixes / suffixes
 *            example: IU4QSG
 *          name:
 *            type: string
 *            minLength: 1
 *            maxLength: 50
 *            description: Name of the user
 *            example: Alessandro
 *          email:
 *            type: string
 *            format: email
 *            description: Email of the user
 *            example: alessandro@iu4qsg.it
 *          password:
 *            type: string
 *            minLength: 1
 *            maxLength: 64
 *            format: password
 *            description: Hashed password (must be strong password)
 *          isAdmin:
 *            type: boolean
 *            description: If user is admin
 *          isVerified:
 *            type: boolean
 *            description: If user has verified email
 *          verificationCode:
 *            type: string
 *            description: Account verification code
 *          passwordReset:
 *            $ref: '#/components/schemas/PasswordReset'
 */

@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ERROR, customName: "User" },
})
@pre<UserClass>("save", function () {
  this.phoneNumber = parsePhoneNumber(
    this.phoneNumber,
    "IT",
  )!.formatInternational();
  logger.debug(`Parsed phone number: ${this.phoneNumber}`);
})
export class UserClass {
  @prop({ required: true, minlength: 1, maxlength: 10, uppercase: true })
  public callsign!: string; // without prefix or suffix

  @prop({ required: false })
  public address?: string;

  @prop({ required: false })
  public city?: string;

  @prop({ required: false })
  public province?: string;

  @prop({ required: false })
  public lat?: number;

  @prop({ required: false })
  public lon?: number;

  @prop({ required: true, minlength: 1, maxlength: 50 })
  public name!: string;

  @prop({ required: true, validate: IsEmail.validate })
  public email!: string;

  @prop({
    required: true,
    validate: (e: unknown) =>
      typeof e === "string" && isValidPhoneNumber(e, "IT"),
  })
  public phoneNumber!: string;

  @prop({ required: true })
  public password!: string;

  @prop({ required: true, default: false })
  public isAdmin!: boolean;

  @prop({ required: false, default: false })
  public isDev?: boolean;

  @prop({ required: true, default: false })
  public isVerified!: boolean;

  @prop({ required: false })
  public verificationCode?: string;

  @prop({ required: false, type: () => PasswordReset })
  public passwordReset?: PasswordReset;

  public async isValidPw(this: DocumentType<UserClass>, plainPw: string) {
    return await bcrypt.compare(plainPw, this.password);
  }
}
