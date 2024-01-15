import {
    DocumentType,
    modelOptions,
    pre,
    prop,
    Ref,
    Severity
} from "@typegoose/typegoose";
import IsEmail from "isemail";
import bcrypt from "bcrypt";
import { JoinRequestClass } from "../../joinRequest/models";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import { logger } from "../../../shared";
import { BasePostClass } from "../../post/models/BasePost";
import { CommentClass } from "../../comment/models/Comment";

/**
 * @swagger
 *  components:
 *    schemas:
 *      User:
 *        type: object
 *        required:
 *          - callsign
 *          - name
 *          - email
 *          - phoneNumber
 *          - password
 *          - isAdmin
 *          - joinRequests
 *          - posts
 *          - comments
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
 *          passwordResetCode:
 *            type: string
 *            description: Password reset code
 *          joinRequests:
 *            type: array
 *            items:
 *              type: string
 *              format: ObjectId
 *            description: ObjectIds of the join requests
 *          posts:
 *            type: array
 *            items:
 *              type: string
 *              format: ObjectId
 *            description: ObjectIds of published posts
 *          comments:
 *            type: array
 *            items:
 *              type: string
 *              format: ObjectId
 *            description: ObjectIds of published comments
 */

@modelOptions({
    schemaOptions: { timestamps: true },
    options: { allowMixed: Severity.ERROR, customName: "User" }
})
@pre<UserClass>("save", function () {
    this.phoneNumber = parsePhoneNumber(
        this.phoneNumber,
        "IT"
    ).formatInternational();
    logger.debug("Parsed phone number: " + this.phoneNumber);
})
export class UserClass {
    @prop({ required: true, minlength: 1, maxlength: 10, uppercase: true })
    public callsign!: string; // without prefix or suffix

    @prop({ required: true, minlength: 1, maxlength: 50 })
    public name!: string;

    @prop({ required: true, validate: IsEmail.validate })
    public email!: string;

    @prop({ required: true, validate: isValidPhoneNumber })
    public phoneNumber!: string;

    @prop({ required: true })
    public password!: string;

    @prop({ required: true, default: false })
    public isAdmin!: boolean;

    @prop({ required: true, default: false })
    public isVerified!: boolean;

    @prop({ required: false })
    public passwordResetCode?: string;

    @prop({ required: false })
    public verificationCode?: string;

    @prop({ required: true, default: [], ref: () => JoinRequestClass })
    public joinRequests!: Ref<JoinRequestClass>[];

    @prop({ required: true, default: [], ref: () => BasePostClass })
    public posts!: Ref<BasePostClass>[];

    @prop({ required: true, default: [], ref: () => CommentClass })
    public comments!: Ref<CommentClass>[];

    // @prop({ required: true, default: [], ref: "Comment" })
    // public comments!: Ref<"Comment">[];

    public async isValidPw(this: DocumentType<UserClass>, plainPw: string) {
        return await bcrypt.compare(plainPw, this.password);
    }
}
