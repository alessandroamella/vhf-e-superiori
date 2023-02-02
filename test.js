// db.events.insertMany({})

import fs from "fs";

const events = [
    {
        title: "13° Flash Mob VHF 2m",
        start: "2023-01-29 10:00",
        end: "2023-01-29 12:00"
    },
    {
        title: "14° Flash Mob UHF 70cm",
        start: "2023-02-26 10:00",
        end: "2023-02-26 12:00"
    },
    {
        title: "15° Flash Mob UHF 23cm",
        start: "2023-03-26 10:00",
        end: "2023-03-26 12:00"
    },
    {
        title: "16° Flash Mob VHF 2m",
        start: "2023-04-30 10:00",
        end: "2023-04-30 12:00"
    },
    {
        title: "17° Flash Mob UHF 70cm",
        start: "2023-05-28 10:00",
        end: "2023-05-28 12:00"
    },
    {
        title: "18° Flash Mob UHF 23cm",
        start: "2023-06-25 10:00",
        end: "2023-06-25 12:00"
    },
    {
        title: "19° Flash Mob VHF 2m",
        start: "2023-07-30 10:00",
        end: "2023-07-30 12:00"
    },
    {
        title: "20° Flash Mob UHF 70cm",
        start: "2023-08-27 10:00",
        end: "2023-08-27 12:00"
    },
    {
        title: "21° Flash Mob UHF 23cm",
        start: "2023-09-24 10:00",
        end: "2023-09-24 12:00"
    },
    {
        title: "22° Flash Mob VHF 2m",
        start: "2023-10-29 10:00",
        end: "2023-10-29 12:00"
    },
    {
        title: "23° Flash Mob UHF 70cm",
        start: "2023-11-26 10:00",
        end: "2023-11-26 12:00"
    },
    {
        title: "24° Flash Mob UHF 23cm",
        start: "2023-12-31 10:00",
        end: "2023-12-31 12:00"
    }
];
const arr = events.map(e => ({
    name: e.title,
    date: new Date(e.start),
    band: e.title.split("HF ")[1],
    joinStart: new Date(
        new Date(e.start).getTime() - new Date(24 * 60 * 60 * 1000) * 60
    ),
    joinDeadline: new Date(
        new Date(e.start).getTime() - new Date(24 * 60 * 60 * 1000) * 7
    ),
    joinRequests: []
}));

fs.writeFileSync("test.debug.json", JSON.stringify(arr, null, 4), {
    encoding: "utf-8"
});

/*

const arr = [
    {
        name: "13° Flash Mob VHF 2m",
        date: "2023-01-29T09:00:00.000Z",
        band: "2m",
        joinStart: "2022-11-30T09:00:00.000Z",
        joinDeadline: "2023-01-22T09:00:00.000Z",
        joinRequests: []
    },
    {
        name: "14° Flash Mob UHF 70cm",
        date: "2023-02-26T09:00:00.000Z",
        band: "70cm",
        joinStart: "2022-12-28T09:00:00.000Z",
        joinDeadline: "2023-02-19T09:00:00.000Z",
        joinRequests: []
    },
    {
        name: "15° Flash Mob UHF 23cm",
        date: "2023-03-26T08:00:00.000Z",
        band: "23cm",
        joinStart: "2023-01-25T08:00:00.000Z",
        joinDeadline: "2023-03-19T08:00:00.000Z",
        joinRequests: []
    },
    {
        name: "16° Flash Mob VHF 2m",
        date: "2023-04-30T08:00:00.000Z",
        band: "2m",
        joinStart: "2023-03-01T08:00:00.000Z",
        joinDeadline: "2023-04-23T08:00:00.000Z",
        joinRequests: []
    },
    {
        name: "17° Flash Mob UHF 70cm",
        date: "2023-05-28T08:00:00.000Z",
        band: "70cm",
        joinStart: "2023-03-29T08:00:00.000Z",
        joinDeadline: "2023-05-21T08:00:00.000Z",
        joinRequests: []
    },
    {
        name: "18° Flash Mob UHF 23cm",
        date: "2023-06-25T08:00:00.000Z",
        band: "23cm",
        joinStart: "2023-04-26T08:00:00.000Z",
        joinDeadline: "2023-06-18T08:00:00.000Z",
        joinRequests: []
    },
    {
        name: "19° Flash Mob VHF 2m",
        date: "2023-07-30T08:00:00.000Z",
        band: "2m",
        joinStart: "2023-05-31T08:00:00.000Z",
        joinDeadline: "2023-07-23T08:00:00.000Z",
        joinRequests: []
    },
    {
        name: "20° Flash Mob UHF 70cm",
        date: "2023-08-27T08:00:00.000Z",
        band: "70cm",
        joinStart: "2023-06-28T08:00:00.000Z",
        joinDeadline: "2023-08-20T08:00:00.000Z",
        joinRequests: []
    },
    {
        name: "21° Flash Mob UHF 23cm",
        date: "2023-09-24T08:00:00.000Z",
        band: "23cm",
        joinStart: "2023-07-26T08:00:00.000Z",
        joinDeadline: "2023-09-17T08:00:00.000Z",
        joinRequests: []
    },
    {
        name: "22° Flash Mob VHF 2m",
        date: "2023-10-29T09:00:00.000Z",
        band: "2m",
        joinStart: "2023-08-30T09:00:00.000Z",
        joinDeadline: "2023-10-22T09:00:00.000Z",
        joinRequests: []
    },
    {
        name: "23° Flash Mob UHF 70cm",
        date: "2023-11-26T09:00:00.000Z",
        band: "70cm",
        joinStart: "2023-09-27T09:00:00.000Z",
        joinDeadline: "2023-11-19T09:00:00.000Z",
        joinRequests: []
    },
    {
        name: "24° Flash Mob UHF 23cm",
        date: "2023-12-31T09:00:00.000Z",
        band: "23cm",
        joinStart: "2023-11-01T09:00:00.000Z",
        joinDeadline: "2023-12-24T09:00:00.000Z",
        joinRequests: []
    }
] as any[];
for (const a of arr) {
    a.date = new Date(a.date);
    a.joinStart = new Date(a.joinStart);
    a.joinDeadline = new Date(a.joinDeadline);
    const doc = new Event(a);
    doc.save();
}
*/
