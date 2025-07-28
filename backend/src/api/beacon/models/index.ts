import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { BeaconClass } from "./Beacon";
import { BeaconPropertiesClass } from "./BeaconProperties";

export const Beacon = getModelForClass(BeaconClass);
export type BeaconDoc = DocumentType<BeaconClass>;

export const BeaconProperties = getModelForClass(BeaconPropertiesClass);
export type BeaconPropertiesDoc = DocumentType<BeaconPropertiesClass>;

export type BeaconDocWithProp = BeaconDoc & {
  properties: BeaconPropertiesDoc;
};
export type BeaconDocWithProps = BeaconDoc & {
  properties: BeaconPropertiesDoc[];
};
