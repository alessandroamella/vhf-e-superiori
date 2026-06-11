/**
 * Script temporaneo, da eseguire UNA SOLA VOLTA.
 *
 * Per ogni beacon, se esiste un utente con lo stesso callsign del campo
 * "Nominativo del manutentore" (BeaconProperties.name), gli assegna
 * l'ownership del beacon (Beacon.owner).
 *
 * Esegui da backend/:  npx ts-node src/scripts/assignBeaconOwners.ts
 *
 * Aggiungi --force per sovrascrivere owner già impostati (default: salta).
 */
import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../api/auth/models";
import { Beacon, BeaconProperties } from "../api/beacon/models";

const FORCE = process.argv.includes("--force");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI non impostata");

  await mongoose.connect(uri, { timeoutMS: 10000 });
  console.log("Connesso a MongoDB");

  const beacons = await Beacon.find();
  console.log(`Trovati ${beacons.length} beacon\n`);

  let assigned = 0;
  let skippedExisting = 0;
  let noName = 0;
  let noUser = 0;

  for (const beacon of beacons) {
    // IU4QSG come owner = trattato come se non avesse owner (va riassegnato)
    const currentOwner = beacon.owner
      ? await User.findById(beacon.owner)
      : null;
    const hasRealOwner =
      !!currentOwner && currentOwner.callsign?.toUpperCase() !== "IU4QSG";

    if (hasRealOwner && !FORCE) {
      skippedExisting++;
      console.log(`- ${beacon.callsign}: owner già presente, salto`);
      continue;
    }

    // properties più recente per questo beacon
    const props = await BeaconProperties.findOne({
      forBeacon: beacon._id,
    }).sort({ editDate: -1 });

    const maintainer = props?.name?.trim();
    if (!maintainer) {
      noName++;
      console.log(`- ${beacon.callsign}: nessun nominativo manutentore`);
      continue;
    }

    // togli pre/suffissi separati da "/" (es. "IZ6WLW/B" -> "IZ6WLW"),
    // tenendo la parte alfanumerica più lunga: gli utenti salvano il callsign
    // senza pre/suffissi
    const searchCallsign = maintainer
      .split("/")
      .reduce((a, b) => (b.length > a.length ? b : a), "");

    // match case-insensitive sul callsign utente
    const user = await User.findOne({
      callsign: new RegExp(
        `^${searchCallsign.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
    });
    if (!user) {
      noUser++;
      // Se l'owner attuale è IU4QSG e non si trova nessun altro, toglilo
      if (currentOwner && currentOwner.callsign?.toUpperCase() === "IU4QSG") {
        beacon.owner = undefined;
        await beacon.save();
        console.log(
          `✗ ${beacon.callsign}: nessun utente "${maintainer}", rimosso owner IU4QSG`,
        );
      } else {
        console.log(
          `- ${beacon.callsign}: nessun utente con callsign "${maintainer}"`,
        );
      }
      continue;
    }

    beacon.owner = user._id;
    await beacon.save();
    assigned++;
    console.log(
      `✓ ${beacon.callsign}: owner -> ${user.callsign} (${user._id})`,
    );
  }

  console.log("\n=== Riepilogo ===");
  console.log(`Owner assegnati:        ${assigned}`);
  console.log(`Saltati (già owner):    ${skippedExisting}`);
  console.log(`Senza nominativo:       ${noName}`);
  console.log(`Nessun utente trovato:  ${noUser}`);

  await mongoose.disconnect();
  console.log("Disconnesso. Fatto.");
}

main().catch((err) => {
  console.error("Errore nello script:", err);
  process.exit(1);
});
