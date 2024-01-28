import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { QsoClass } from "./Qso";

export const Qso = getModelForClass(QsoClass);

export type QsoDoc = DocumentType<QsoClass>;
