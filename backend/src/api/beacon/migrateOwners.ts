import { isValidObjectId } from "mongoose";
import { logger } from "../../shared/logger";
import { User } from "../auth/models";
import { Beacon } from "./models";

/**
 * One-time, idempotent migration: the beacon `owner` field used to store a User
 * ObjectId; it now stores a free-form maintainer callsign string. Convert any
 * legacy ObjectId owners to the corresponding user's callsign. Orphaned owners
 * (user no longer exists) are cleared so the beacon shows as "in verifica".
 *
 * After conversion, owners are short callsigns (not 12/24-char ObjectId-like
 * strings), so re-running this is a no-op.
 */
export async function migrateBeaconOwners(): Promise<void> {
  const beacons = await Beacon.find({ owner: { $exists: true, $ne: null } });

  let converted = 0;
  let cleared = 0;
  for (const beacon of beacons) {
    const owner = beacon.owner as unknown as string | undefined;
    // Only legacy ObjectId-shaped owners need converting; real callsigns
    // (short, non-hex) are already in the new format.
    if (!owner || !isValidObjectId(owner)) continue;

    const user = await User.findById(owner).select("callsign");
    if (user?.callsign) {
      beacon.owner = user.callsign;
      converted++;
    } else {
      beacon.owner = undefined;
      cleared++;
    }
    await beacon.save();
  }

  if (converted || cleared) {
    logger.info(
      `Migrated beacon owners: ${converted} converted to callsign, ${cleared} cleared`,
    );
  }
}
