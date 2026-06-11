import { Types } from "mongoose";
import { UserDoc } from "../auth/models";
import { BeaconDoc, BeaconProperties } from "./models";

/**
 * Resolves the maintainer of a beacon. Newer beacons have an explicit
 * `owner`. Older beacons created before the ownership system existed
 * fall back to the author of their oldest properties entry (i.e. whoever
 * originally created/edited it first).
 */
export async function resolveBeaconOwnerId(
  beacon: Pick<BeaconDoc, "_id" | "owner">,
): Promise<Types.ObjectId | null> {
  if (beacon.owner) {
    return beacon.owner as unknown as Types.ObjectId;
  }

  const oldest = await BeaconProperties.findOne({ forBeacon: beacon._id })
    .sort({ editDate: 1 })
    .select("editAuthor");

  return (oldest?.editAuthor as unknown as Types.ObjectId | undefined) ?? null;
}

export function canEditBeacon(
  ownerId: Types.ObjectId | null,
  user: Pick<UserDoc, "_id" | "isAdmin">,
): boolean {
  if (user.isAdmin) return true;
  return !!ownerId && ownerId.toString() === user._id.toString();
}
