import { DocumentType, getModelForClass } from "@typegoose/typegoose";
import { UserClass } from "./User";
import { qrz } from "../../qrz";
import { location } from "../../location";

export const User = getModelForClass(UserClass);

export { UserClass } from "./User";
export type UserDoc = DocumentType<UserClass>;

async function sas() {
    // wait 5s
    await new Promise(resolve => setTimeout(resolve, 5000));

    const users = await User.find({});
    for (const u of users) {
        const scraped = await qrz.getInfo(u.callsign);
        if (!scraped) {
            console.warn("Failed to scrape " + u.callsign);
            continue;
        } else if (!scraped.locator && !scraped.lat && !scraped.lon) {
            console.warn("Failed to scrape locator for " + u.callsign);
            continue;
        }
        let lat, lon;
        if (scraped.lat && scraped.lon) {
            lat = scraped.lat;
            lon = scraped.lon;
        } else {
            // this means surely that scraped.locator is not null
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const pos = location.calculateLatLon(scraped.locator!);
            if (!pos) {
                console.warn("Failed to calculate position for " + u.callsign);
                continue;
            }
            [lat, lon] = pos;
        }
        const geolocalized = await location.reverseGeocode(lat, lon);
        if (!geolocalized) {
            console.warn("Failed to reverse geocode for " + u.callsign);
            continue;
        }
        const { city, province, formatted } = location.parseData(geolocalized);

        u.city = city;
        u.province = province;
        u.lat = lat;
        u.lon = lon;
        u.address = formatted;

        await u.save();
        console.log("Updated " + u.callsign);
    }
}
sas();
