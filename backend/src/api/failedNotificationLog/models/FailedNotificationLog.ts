import { index, modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: { timestamps: true },
  options: { customName: "FailedNotificationLog" },
})
// Indice composto per garantire l'unicità della coppia callsign-event
@index({ callsign: 1, eventId: 1 }, { unique: true })
export class FailedNotificationLogClass {
  @prop({ required: true, uppercase: true })
  public callsign!: string;

  @prop({ required: true })
  public eventId!: string;

  @prop({ required: true })
  public eventName!: string;
}
