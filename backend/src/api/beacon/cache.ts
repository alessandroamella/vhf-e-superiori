import NodeCache from "node-cache";
import { logger } from "../../shared/logger";
import { BeaconDocWithProps, BeaconLeanWithProp } from "./models";

// Cache for 15 minutes
const beaconCache = new NodeCache({ stdTTL: 60 * 15 });

const CACHE_KEYS = {
  ALL_BEACONS: "all_beacons",
  BEACON_PREFIX: "beacon_",
} as const;

export class BeaconCache {
  static getAllBeacons(): BeaconLeanWithProp[] | undefined {
    try {
      return beaconCache.get(CACHE_KEYS.ALL_BEACONS);
    } catch (err) {
      logger.error("Error getting all beacons from cache:", err);
      return undefined;
    }
  }

  static setAllBeacons(beacons: BeaconLeanWithProp[]) {
    try {
      beaconCache.set(CACHE_KEYS.ALL_BEACONS, beacons);
      logger.debug(`Cached ${beacons.length} beacons`);
    } catch (err) {
      logger.error("Error setting all beacons in cache:", err);
    }
  }

  static getBeacon(id: string): BeaconDocWithProps | undefined {
    try {
      return beaconCache.get(`${CACHE_KEYS.BEACON_PREFIX}${id}`);
    } catch (err) {
      logger.error(`Error getting beacon ${id} from cache:`, err);
      return undefined;
    }
  }

  static setBeacon(id: string, beacon: BeaconDocWithProps) {
    try {
      beaconCache.set(`${CACHE_KEYS.BEACON_PREFIX}${id}`, beacon);
      logger.debug(`Cached beacon ${id}`);
    } catch (err) {
      logger.error(`Error setting beacon ${id} in cache:`, err);
    }
  }

  static invalidateAll() {
    try {
      beaconCache.flushAll();
      logger.debug("Invalidated all beacon cache");
    } catch (err) {
      logger.error("Error invalidating all beacon cache:", err);
    }
  }

  static invalidateBeacon(id: string) {
    try {
      beaconCache.del(`${CACHE_KEYS.BEACON_PREFIX}${id}`);
      // Also invalidate all beacons cache since the list has changed
      beaconCache.del(CACHE_KEYS.ALL_BEACONS);
      logger.debug(`Invalidated cache for beacon ${id}`);
    } catch (err) {
      logger.error(`Error invalidating beacon ${id} cache:`, err);
    }
  }

  static invalidateAllBeacons() {
    try {
      beaconCache.del(CACHE_KEYS.ALL_BEACONS);
      logger.debug("Invalidated all beacons list cache");
    } catch (err) {
      logger.error("Error invalidating all beacons list cache:", err);
    }
  }
}
