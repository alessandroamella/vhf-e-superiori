import {
    DocumentType,
    modelOptions,
    pre,
    prop,
    Ref
} from "@typegoose/typegoose";
import IsEmail from "isemail";
import bcrypt from "bcrypt";
import { JoinRequestClass } from "../../joinRequest/models";

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
 *          - password
 *          - isAdmin
 *          - joinRequests
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
 *          joinRequests:
 *            type: array
 *            items:
 *              type: string
 *            description: ObjectIds of the join requests
 */

@pre<UserClass>("save", async function (next) {
    const plainPw = this.password;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(plainPw, salt);
    next();
})
@modelOptions({
    schemaOptions: { timestamps: true },
    options: { customName: "User" }
})
export class UserClass {
    @prop({ required: true, minlength: 1, maxlength: 10, uppercase: true })
    public callsign!: string; // without prefix or suffix

    @prop({ required: true, minlength: 1, maxlength: 50 })
    public name!: string;

    @prop({ required: true, validate: IsEmail.validate })
    public email!: string;

    @prop({ required: true })
    public password!: string;

    @prop({ required: true, default: false })
    public isAdmin!: boolean;

    @prop({ required: true, default: [], ref: () => JoinRequestClass })
    public joinRequests!: Ref<JoinRequestClass>[];

    public async isValidPw(this: DocumentType<UserClass>, plainPw: string) {
        return await bcrypt.compare(plainPw, this.password);
    }
}
