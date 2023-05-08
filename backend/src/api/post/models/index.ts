import {
    DocumentType,
    getDiscriminatorModelForClass,
    getModelForClass
} from "@typegoose/typegoose";
import { AntennaPostClass } from "./AntennaPost";
import { BasePostClass } from "./BasePost";
import { MyFlashMobPostClass } from "./MyFlashMobPost";
import { RadioStationPostClass } from "./RadioStationPost";

export const BasePost = getModelForClass(BasePostClass);

export const AntennaPost = getDiscriminatorModelForClass(
    BasePost,
    AntennaPostClass
);
export const MyFlashMobPost = getDiscriminatorModelForClass(
    BasePost,
    MyFlashMobPostClass
);
export const RadioStationPost = getDiscriminatorModelForClass(
    BasePost,
    RadioStationPostClass
);

export { AntennaPostClass } from "./AntennaPost";
export { MyFlashMobPostClass } from "./MyFlashMobPost";
export { RadioStationPostClass } from "./RadioStationPost";

export type AntennaPostDoc = DocumentType<AntennaPostClass>;
export type MyFlashMobPostDoc = DocumentType<MyFlashMobPostClass>;
export type RadioStationPostDoc = DocumentType<RadioStationPostClass>;
