/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { logger } from "../../shared/logger";
import { envs } from "../../shared/envs";
import { ParsedData, QthData } from "./interfaces";

class Location {
    private static str_chr_up = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // Constants.
    private static str_chr_lo = "abcdefghijklmnopqrstuvwxyz";
    private static str_num = "0123456789";

    public async geocode(address: string): Promise<QthData | null> {
        try {
            logger.info(`Google Maps q: ${address}`);
            const { data } = await axios.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                {
                    params: {
                        key: envs.GOOGLE_MAPS_API_KEY,
                        address
                    }
                }
            );

            if (data.error_message) {
                logger.error(
                    "Error while fetching info from Google Maps: " +
                        data.status +
                        " - " +
                        data.error_message
                );
                return null;
            }

            return data.results[0];
        } catch (err) {
            logger.error("Error while fetching info from Google Maps");
            if (axios.isAxiosError(err)) {
                logger.error(err.response?.data || err.response || err);
            } else {
                logger.error(err as any);
            }
            return null;
        }
    }

    public async reverseGeocode(
        lat: number,
        lon: number
    ): Promise<QthData | null> {
        try {
            logger.info(`Google Maps lat: ${lat}, lon: ${lon}`);
            const { data } = await axios.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                {
                    params: {
                        key: envs.GOOGLE_MAPS_API_KEY,
                        latlng: `${lat},${lon}`
                    }
                }
            );

            if (data.error_message) {
                logger.error(
                    "Error while fetching info from Google Maps: " +
                        data.status +
                        " - " +
                        data.error_message
                );
                return null;
            }

            return data.results[0];
        } catch (err) {
            logger.error("Error while fetching info from Google Maps");
            if (axios.isAxiosError(err)) {
                logger.error(err.response?.data || err.response || err);
            } else {
                logger.error(err as any);
            }
            return null;
        }
    }

    public calculateQth(lat: number, lon: number): string | null {
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            logger.debug(
                "Latitude must be between -90 and 90, and longitude between -180 and 180"
            );
            return null;
        }

        lat += 90; // Locator lat/lon shift.
        lon += 180;

        let qth = Location.str_chr_up.charAt(Math.floor(lon / 20)); // 1st digit: 20deg longitude slot.
        qth += Location.str_chr_up.charAt(Math.floor(lat / 10)); // 2nd digit: 10deg latitude slot.
        qth += Location.str_num.charAt(Math.floor((lon % 20) / 2)); // 3rd digit: 2deg longitude slot.
        qth += Location.str_num.charAt(Math.floor((lat % 10) / 1)); // 4th digit: 1deg latitude slot.
        qth += Location.str_chr_lo.charAt(Math.floor((lon % 2) * (60 / 5))); // 5th digit: 5min longitude slot.
        qth += Location.str_chr_lo.charAt(Math.floor((lat % 1) * (60 / 2.5))); // 6th digit: 2.5min latitude slot.

        return qth;
    }

    public calculateLatLon(qth: string): [number, number] | null {
        if (qth.length != 4 && qth.length != 6) {
            logger.debug("The QTH locator must be 4 or 6 charcters long");
            return null;
        } // Verify string length: only 4 and 6 character strings are accepted.

        qth = qth.toUpperCase(); // Convert to upper case.

        if (
            qth.charAt(0) < "A" ||
            qth.charAt(0) > "S" ||
            qth.charAt(1) < "A" ||
            qth.charAt(1) > "S" ||
            qth.charAt(2) < "0" ||
            qth.charAt(2) > "9" ||
            qth.charAt(3) < "0" ||
            qth.charAt(3) > "9"
        ) {
            // Make sure the locator is composed by two characters and two digits.
            return null;
        }

        if (
            qth.length == 6 &&
            (qth.charAt(4) < "A" ||
                qth.charAt(4) > "X" ||
                qth.charAt(5) < "A" ||
                qth.charAt(5) > "X")
        ) {
            // For 6 characters locators, make sure the last two are letters.
            logger.debug(
                'The fourth and fifth characters of QTH locator must be letters between "A" and "X"'
            );
            return null;
        }

        let lat = Location.str_chr_up.indexOf(qth.charAt(1)) * 10; // 2nd digit: 10deg latitude slot.
        let lon = Location.str_chr_up.indexOf(qth.charAt(0)) * 20; // 1st digit: 20deg longitude slot.
        lat += Location.str_num.indexOf(qth.charAt(3)) * 1; // 4th digit: 1deg latitude slot.
        lon += Location.str_num.indexOf(qth.charAt(2)) * 2; // 3rd digit: 2deg longitude slot.
        if (qth.length == 6) {
            lat += (Location.str_chr_up.indexOf(qth.charAt(5)) * 2.5) / 60; // 6th digit: 2.5min latitude slot.
            lon += (Location.str_chr_up.indexOf(qth.charAt(4)) * 5) / 60; // 5th digit: 5min longitude slot.
        }

        if (qth.length == 4) {
            // Get coordinates of the center of the square.
            lat += 0.5 * 1;
            lon += 0.5 * 2;
        } else {
            lat += (0.5 * 2.5) / 60;
            lon += (0.5 * 5) / 60;
        }

        lat -= 90; // Locator lat/lon origin shift.
        lon -= 180;

        return [lat, lon];
    }

    public parseData(geocoded: QthData): ParsedData {
        const city =
            geocoded.address_components.find(
                e =>
                    e.types.includes("administrative_area_level_3") ||
                    e.types.includes("locality")
            )?.long_name || geocoded.address_components[0]?.long_name;
        const province =
            geocoded.address_components.find(
                e =>
                    e.types.includes("administrative_area_level_2") ||
                    e.types.includes("administrative_area_level_1")
            )?.short_name ||
            geocoded.address_components[1]?.short_name ||
            geocoded.address_components[0]?.short_name;

        const country =
            geocoded.address_components.find(e => e.types.includes("country"))
                ?.long_name ||
            geocoded.address_components[2]?.long_name ||
            geocoded.address_components[1]?.long_name;

        const formatted =
            city && province && country
                ? `${city}, ${province}, ${country}`
                : geocoded.formatted_address;

        return {
            city,
            province,
            country,
            formatted
        };
    }
}

export const location = new Location();

export default Location;
