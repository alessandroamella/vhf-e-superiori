import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { CounterViewClass } from "./CounterView";

const CounterView = getModelForClass(CounterViewClass);

export { CounterViewClass } from "./CounterView";
export type CounterViewDoc = DocumentType<CounterViewClass>;
export default CounterView;
