import { modelOptions, prop, Ref } from "@typegoose/typegoose";
/**
 * @swagger
 *  components:
 *    schemas:
 *      CounterView:
 *        type: object
 *        required:
 *          - ip
 *          - date
 *        properties:
 *          fromUser:
 *            type: string
 *            description: ObjectId of the user who made this (optional)
 *          ip:
 *            type: string
 *            description: IP address of the connection
 *          createdAt:
 *            type: string
 *            format: date-time
 *            description: Date of the connection
 */
@modelOptions({
    schemaOptions: { timestamps: true },
    options: { customName: "CounterView" }
})
export class CounterViewClass {
    @prop({ required: false, ref: "User" })
    public fromUser?: Ref<"User">;

    @prop({ required: true })
    public ip!: string;
}
