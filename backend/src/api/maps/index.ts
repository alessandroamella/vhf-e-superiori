/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { logger } from "../../shared/logger";
import { envs } from "../../shared/envs";
import { QthData } from "./interfaces";

class GoogleMaps {
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
}

export const googleMaps = new GoogleMaps();

export default GoogleMaps;
