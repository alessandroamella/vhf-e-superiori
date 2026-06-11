/**
 * Script temporaneo, da eseguire UNA SOLA VOLTA.
 *
 * Assegna un owner (manutentore) a ogni beacon, con questa logica:
 *
 *  - se il beacon NON ha owner (oppure il suo owner è IU4QSG, considerato
 *    "non valido"):
 *      1. se ha un nome (BeaconProperties.name), lo si ripulisce dai pre/suffissi
 *         ("IZ6WLW/B" -> "IZ6WLW") e si cerca un utente con quel callsign;
 *         se esiste, diventa owner;
 *      2. altrimenti si cerca un utente con callsign uguale a quello del
 *         beacon; se esiste, diventa owner;
 *      3. altrimenti l'owner diventa Pietro IU4JJJ.
 *  - se il beacon ha già un owner valido, viene lasciato invariato.
 *
 * Esegui da backend/:  npx ts-node src/scripts/assignBeaconOwners.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../api/auth/models";
import { Beacon, BeaconProperties } from "../api/beacon/models";

const FALLBACK_CALLSIGN = "IU4JJJ";
const INVALID_OWNER_CALLSIGN = "IU4QSG";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI non impostata");

  await mongoose.connect(uri, { timeoutMS: 10000 });
  console.log("Connesso a MongoDB");

  const fallbackUser = await User.findOne({
    callsign: new RegExp(`^${FALLBACK_CALLSIGN}$`, "i"),
  });
  if (!fallbackUser) {
    throw new Error(`Utente di fallback ${FALLBACK_CALLSIGN} non trovato`);
  }
  console.log(
    `Owner di fallback: ${fallbackUser.callsign} (${fallbackUser._id})\n`,
  );

  const beacons = await Beacon.find();
  console.log(`Trovati ${beacons.length} beacon\n`);

  let nameCleared = 0;

  for (const beacon of beacons) {
    const props = await BeaconProperties.findOne({
      forBeacon: beacon._id,
    }).sort({ editDate: -1 });

    if (
      props?.name &&
      props.name.trim().toUpperCase() === beacon.callsign.toUpperCase()
    ) {
      props.name = undefined;
      await props.save();
      nameCleared++;
      console.log(`✓ ${beacon.callsign}: rimosso name uguale al callsign`);
    }
  }

  let byName = 0;
  let byCallsign = 0;
  let byFallback = 0;
  let skipped = 0;

  for (const beacon of beacons) {
    const currentOwner = beacon.owner
      ? await User.findById(beacon.owner)
      : null;
    const ownerIsValid =
      !!currentOwner &&
      currentOwner.callsign?.toUpperCase() !== INVALID_OWNER_CALLSIGN;

    if (ownerIsValid) {
      skipped++;
      console.log(
        `- ${beacon.callsign}: owner valido (${currentOwner?.callsign}), salto`,
      );
      continue;
    }

    // Step 1: prova ad associare in base al nome (nominativo del manutentore)
    const props = await BeaconProperties.findOne({
      forBeacon: beacon._id,
    }).sort({ editDate: -1 });

    const maintainer = props?.name?.trim();
    let matchedUser = null;
    if (maintainer) {
      // tieni la parte alfanumerica più lunga (togli pre/suffissi con "/")
      const searchCallsign = maintainer
        .split("/")
        .reduce((a, b) => (b.length > a.length ? b : a), "");
      if (searchCallsign) {
        matchedUser = await User.findOne({
          callsign: new RegExp(
            `^${searchCallsign.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "i",
          ),
        });
      }
    }

    if (matchedUser) {
      beacon.owner = matchedUser._id;
      await beacon.save();
      byName++;
      console.log(
        `✓ ${beacon.callsign}: owner -> ${matchedUser.callsign} (da nome "${maintainer}")`,
      );
      continue;
    }

    // Step 1bis: prova ad associare in base al callsign del beacon
    matchedUser = await User.findOne({
      callsign: new RegExp(
        `^${beacon.callsign.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
    });

    if (matchedUser) {
      beacon.owner = matchedUser._id;
      await beacon.save();
      byCallsign++;
      console.log(
        `✓ ${beacon.callsign}: owner -> ${matchedUser.callsign} (da callsign beacon)`,
      );
    } else {
      // Step 2: fallback su IU4JJJ
      beacon.owner = fallbackUser._id;
      await beacon.save();
      byFallback++;
      console.log(
        `✓ ${beacon.callsign}: owner -> ${fallbackUser.callsign} (fallback)`,
      );
    }
  }

  console.log("\n=== Riepilogo ===");
  console.log(`Name rimossi (uguali a callsign): ${nameCleared}`);
  console.log(`Assegnati da nome:     ${byName}`);
  console.log(`Assegnati da callsign: ${byCallsign}`);
  console.log(`Assegnati a ${FALLBACK_CALLSIGN}:   ${byFallback}`);
  console.log(`Saltati (owner valido): ${skipped}`);

  await mongoose.disconnect();
  console.log("Disconnesso. Fatto.");
}

main().catch((err) => {
  console.error("Errore nello script:", err);
  process.exit(1);
});
