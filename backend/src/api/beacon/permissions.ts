import { UserDoc } from "../auth/models";
import { BeaconDoc } from "./models";

/**
 * Resolves the maintainer callsign of a beacon. The owner is now a free-form
 * callsign string (possibly not a registered user) and may be absent, in which
 * case the beacon is "pending verification".
 */
export function resolveBeaconOwner(
  beacon: Pick<BeaconDoc, "owner">,
): string | null {
  const owner = beacon.owner as unknown as string | undefined;
  return owner && owner.length > 0 ? owner : null;
}

export function canEditBeacon(
  ownerCallsign: string | null,
  user: Pick<UserDoc, "callsign" | "isAdmin">,
): boolean {
  if (user.isAdmin) return true;
  return (
    !!ownerCallsign &&
    !!user.callsign &&
    ownerCallsign.toUpperCase() === user.callsign.toUpperCase()
  );
}
