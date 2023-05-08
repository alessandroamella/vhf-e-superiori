import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { EventClass } from "./Event";

const Event = getModelForClass(EventClass);

export { EventClass } from "./Event";
export type EventDoc = DocumentType<EventClass>;
export default Event;

// DEBUG - use this to save test events

// import moment from "moment";

// const prossimiEventi = [
//     { i: 13, d: new Date(2023, 1 - 1, 29) },
//     { i: 14, d: new Date(2023, 2 - 1, 26) },
//     { i: 15, d: new Date(2023, 3 - 1, 26) },
//     { i: 16, d: new Date(2023, 4 - 1, 30) },
//     { i: 17, d: new Date(2023, 5 - 1, 28) },
//     { i: 18, d: new Date(2023, 6 - 1, 25) },
//     { i: 19, d: new Date(2023, 7 - 1, 30) },
//     { i: 20, d: new Date(2023, 8 - 1, 27) },
//     { i: 21, d: new Date(2023, 9 - 1, 24) },
//     { i: 22, d: new Date(2023, 10 - 1, 29) },
//     { i: 23, d: new Date(2023, 11 - 1, 26) },
//     { i: 24, d: new Date(2023, 12 - 1, 31) }
// ];

// prossimiEventi.forEach(e => e.d.setHours(10));

// for (const evento of prossimiEventi) {
//     const startDate = moment("2023-01-01");
//     const endDate = moment(evento.d).subtract(1, "week");
//     const radioBand = ["70cm", "23cm", "2m"][evento.i % 3]; // rotate through the three bands
//     const eventName = `Radio flash mob ${evento.i}`;

//     const newEvent = new Event({
//         name: eventName,
//         band: radioBand,
//         date: evento.d,
//         joinStart: startDate.toDate(),
//         joinDeadline: endDate.toDate(),
//         logoUrl: "/logo-min.png",
//         joinRequests: []
//     });

//     newEvent.save().then(e => console.log("saved", e)); // save the new event to the database
// }
