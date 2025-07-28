import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { Types } from "mongoose";
import { BeaconClass } from "./Beacon";
import { BeaconPropertiesClass } from "./BeaconProperties";

export const Beacon = getModelForClass(BeaconClass);
export type BeaconDoc = DocumentType<BeaconClass>;

export const BeaconProperties = getModelForClass(BeaconPropertiesClass);
export type BeaconPropertiesDoc = DocumentType<BeaconPropertiesClass>;

// Lean types for when using .lean() queries
export type BeaconLean = BeaconClass & { _id: Types.ObjectId };
export type BeaconPropertiesLean = BeaconPropertiesClass & {
  _id: Types.ObjectId;
};

export type BeaconDocWithProp = BeaconDoc & {
  properties: BeaconPropertiesDoc;
};
export type BeaconDocWithProps = BeaconDoc & {
  properties: BeaconPropertiesDoc[];
};

export type BeaconLeanWithProp = BeaconLean & {
  properties: BeaconPropertiesLean;
};
