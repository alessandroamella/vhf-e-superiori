import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { EventClass } from "./Event";

const Event = getModelForClass(EventClass);

export { EventClass } from "./Event";
export type EventDoc = DocumentType<EventClass>;
export default Event;

// DEBUG - use this to save test events

import moment from "moment";

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

// 2021/04/11
// 2021/05/23
// 2021/06/13
// 2021/10/24
// 2021/11/21
// 2021/12/12
// 2022/03/27
// 2022/06/12
// 2022/07/17
// 2022/10/11
// 2022/10/30
// 2022/12/11
// const eventiPassati = [
//     { i: 1, d: new Date(2021, 4 - 1, 11) },
//     { i: 2, d: new Date(2021, 5 - 1, 23) },
//     { i: 3, d: new Date(2021, 6 - 1, 13) },
//     { i: 4, d: new Date(2021, 10 - 1, 24) },
//     { i: 5, d: new Date(2021, 11 - 1, 21) },
//     { i: 6, d: new Date(2021, 12 - 1, 12) },
//     { i: 7, d: new Date(2022, 3 - 1, 27) },
//     { i: 8, d: new Date(2022, 6 - 1, 12) },
//     { i: 9, d: new Date(2022, 7 - 1, 17) },
//     { i: 10, d: new Date(2022, 10 - 1, 11) },
//     { i: 11, d: new Date(2022, 10 - 1, 30) },
//     { i: 12, d: new Date(2022, 12 - 1, 11) }
// ];

// const eventSwitcher = eventiPassati;

// eventSwitcher.forEach(e => e.d.setHours(10));

// for (const evento of eventSwitcher) {
//     const startDate = moment("2021-01-01");
//     const endDate = moment(evento.d).subtract(1, "week");
//     const radioBand = ["2m", "70cm", "23cm"][evento.i % 3]; // rotate through the three bands
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

// DEBUG - use this to set radio bands correctly
// (async () => {
//     const events = await Event.find();
//     console.log(events);
//     for (const [i, e] of events.entries()) {
//         const radioBand = ["2m", "70cm", "23cm"][i % 3]; // rotate through the three bands
//         e.band = radioBand;
//         await e.save();
//     }
// })();
