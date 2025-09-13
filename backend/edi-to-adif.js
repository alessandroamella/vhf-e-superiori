/**
 * George Smart, M1GEO
 * Simple EDI to ADIF Converter for parsing RSGB Contest Results
 * for use with Cloudlog.
 * 21 May 2012 - Free software under GNU GPL.
 * Modified for generic EDI to ADIF conversion by Mario Roessler, DH5YM
 * 11 Dec 2022 - Free software under GNU GPL.
 * TypeScript version - Module-based implementation
 */
import { readFile, writeFile } from "node:fs/promises";
export class EdiToAdifConverter {
    // RX mode conversion table (not currently supported in ADIF)
    // private static readonly RX_MODES: Record<string, string> = {
    //   "0": "NON",
    //   "1": "SSB",
    //   "2": "CW",
    //   "3": "SSB",
    //   "4": "CW",
    //   "5": "AM",
    //   "6": "FM",
    //   "7": "RTTY",
    //   "8": "SSTV",
    //   "9": "ATV",
    // };
    /**
     * Convert EDI format string to ADIF format
     */
    static convert(ediContent, options = {}) {
        const { programId = "M1GEO+DH5YM EDI-ADIF Converter", programVersion = "Version 2 TS", adifVersion = "3.1", } = options;
        // Initialize station details
        const stationDetails = {
            contestName: "",
            contestCall: "",
            contestClub: "",
            contestLoc: "",
            contestClass: "",
            contestRmrk: "",
            contestBand: "0cm",
            contestMode: "SSB",
        };
        // Stats
        let qsoRead = 0;
        let linesRead = 0;
        let qsoWrote = 0;
        let linesWrote = 0;
        let qsoError = 0;
        // Main data
        const qsoData = [];
        const lines = ediContent.split("\n").map((line) => line.trim());
        let band = "0cm";
        let frequency = "0";
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            linesRead++;
            // Contest Name
            if (line.match(/^TName/i)) {
                stationDetails.contestName = line.replace(/TName=/i, "").trim();
            }
            // Contest Call
            else if (line.match(/^PCall/i)) {
                stationDetails.contestCall = line.replace(/PCall=/i, "");
            }
            // Contest Club
            else if (line.match(/^PClub/i)) {
                stationDetails.contestClub = line.replace(/PClub=/i, "");
            }
            // Contest Locator
            else if (line.match(/^PWWLo/i)) {
                stationDetails.contestLoc = line.replace(/PWWLo=/i, "").trim();
            }
            // Contest Class
            else if (line.match(/^PSect/i)) {
                stationDetails.contestClass = line.replace(/PSect=/i, "");
            }
            // Contest Band and frequency
            else if (line.match(/^PBand/i)) {
                const contestBandRaw = line.replace(/PBand=/i, "").trim();
                band = EdiToAdifConverter.BANDS[contestBandRaw] || "0cm";
                frequency = EdiToAdifConverter.FREQUENCIES[contestBandRaw] || "0";
                stationDetails.contestBand = band;
            }
            // Contest Remarks
            else if (line.match(/^\[Remarks\]/i)) {
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1];
                    if (!nextLine.match(/^\[QSORecords/i)) {
                        linesRead++;
                        stationDetails.contestRmrk = nextLine;
                        i++; // Skip the next line as we've already processed it
                    }
                }
            }
            // QSOs
            else if (line.match(/^\[QSORecords/i)) {
                i++; // Move to the next line after [QSORecords]
                while (i < lines.length) {
                    const qsoLine = lines[i];
                    linesRead++;
                    // Check for end of QSO records
                    if (qsoLine.match(/^\[END/i)) {
                        break;
                    }
                    const qsoFields = qsoLine.split(";");
                    if (qsoFields.length >= 11 &&
                        qsoFields[2] &&
                        qsoFields[2] !== "ERROR" &&
                        qsoFields[2].trim() !== "") {
                        const qsoRecord = {
                            date: qsoFields[0],
                            time: qsoFields[1],
                            callsign: qsoFields[2],
                            mode: qsoFields[3],
                            txRST: qsoFields[4],
                            txSER: qsoFields[5] || "",
                            rxRST: qsoFields[6],
                            rxSER: qsoFields[7] || "",
                            unknownB: qsoFields[8] || "",
                            locator: qsoFields[9],
                            distance: qsoFields[10],
                            unknownC: qsoFields[11] || "",
                            unknownD: qsoFields[12] || "",
                            unknownE: qsoFields[13] || "",
                            unknownF: qsoFields[14] || "",
                        };
                        qsoData.push(qsoRecord);
                        qsoRead++;
                    }
                    else if (qsoFields.length >= 3 && qsoFields[2] === "ERROR") {
                        qsoError++;
                    }
                    i++;
                }
                break; // Exit the outer loop as we've processed all QSO records
            }
            i++;
        }
        // Generate ADIF output
        let adifOutput = `<ADIF_VERS:${adifVersion.length}>${adifVersion}\n`;
        adifOutput += `<PROGRAMID:${programId.length}>${programId}\n`;
        adifOutput += `<PROGRAMVERSION:${programVersion.length}>${programVersion}\n`;
        adifOutput += `<EOH>\n\n`;
        linesWrote += 5;
        for (const qsoRecord of qsoData) {
            // Make the date full (assume 21st century)
            const fullDate = `20${qsoRecord.date}`;
            // Format locator - lowercase the last two letters if 6 characters
            let formattedLocator = qsoRecord.locator;
            if (formattedLocator.length === 6) {
                formattedLocator =
                    formattedLocator.substring(0, 4) +
                        formattedLocator.substring(4).toLowerCase();
            }
            // Convert QSO Mode
            const mode = EdiToAdifConverter.TX_MODES[qsoRecord.mode] || "UNKNOWN";
            // Write the ADIF record
            adifOutput += `<CALL:${qsoRecord.callsign.length}>${qsoRecord.callsign}`;
            adifOutput += `<BAND:${stationDetails.contestBand.length}>${stationDetails.contestBand}`;
            adifOutput += `<FREQ:${frequency.length}>${frequency}`;
            adifOutput += `<MODE:${mode.length}>${mode}`;
            adifOutput += `<QSO_DATE:${fullDate.length}>${fullDate}`;
            adifOutput += `<TIME_ON:${qsoRecord.time.length}>${qsoRecord.time}`;
            adifOutput += `<TIME_OFF:${qsoRecord.time.length}>${qsoRecord.time}`;
            adifOutput += `<RST_RCVD:${qsoRecord.rxRST.length}>${qsoRecord.rxRST}`;
            adifOutput += `<RST_SENT:${qsoRecord.txRST.length}>${qsoRecord.txRST}`;
            // Only add serial numbers if they're not empty
            if (qsoRecord.rxSER && qsoRecord.rxSER.trim() !== "") {
                adifOutput += `<SRX:${qsoRecord.rxSER.length}>${qsoRecord.rxSER}`;
            }
            if (qsoRecord.txSER && qsoRecord.txSER.trim() !== "") {
                adifOutput += `<STX:${qsoRecord.txSER.length}>${qsoRecord.txSER}`;
            }
            adifOutput += `<MY_GRIDSQUARE:${stationDetails.contestLoc.length}>${stationDetails.contestLoc}`;
            adifOutput += `<GRIDSQUARE:${formattedLocator.length}>${formattedLocator}`;
            adifOutput += `<COMMENT:${stationDetails.contestName.length}>${stationDetails.contestName}`;
            adifOutput += `<EOR>\n`;
            linesWrote++;
            qsoWrote++;
        }
        return {
            success: qsoWrote === qsoRead,
            adifData: adifOutput,
            stationDetails,
            qsoCount: {
                read: qsoRead,
                wrote: qsoWrote,
                errors: qsoError,
            },
            lineCount: {
                read: linesRead,
                wrote: linesWrote,
            },
        };
    }
    /**
     * Convenience method to convert from file content (for Node.js environments)
     */
    static async convertFromFile(filePath, options = {}) {
        // This would require fs module in Node.js environment
        const content = await readFile(filePath, "utf-8");
        return EdiToAdifConverter.convert(content, options);
    }
    /**
     * Convenience method to save ADIF output to file (for Node.js environments)
     */
    static async saveToFile(result, outputPath) {
        await writeFile(outputPath, result.adifData, "utf-8");
    }
}
// Hash map for bands frequency conversion
EdiToAdifConverter.BANDS = {
    "50 MHz": "6m",
    "70 MHz": "4m",
    "144 MHz": "2m",
    "432 MHz": "70cm",
    "1,3 GHz": "23cm",
    "2,3 GHz": "13cm",
    "3,4 GHz": "9cm",
    "5,7 GHz": "6cm",
    "10 GHz": "3cm",
    "24 GHz": "1.25cm",
    "47 GHz": "6mm",
    "76 GHz": "4mm",
    "122 GHz": "2.5mm",
    "134 GHz": "2mm",
    "241 GHz": "1mm",
    "300 GHz": "submm",
};
// Hashmap for band to frequency conversion
EdiToAdifConverter.FREQUENCIES = {
    "50 MHz": "50",
    "70 MHz": "70",
    "144 MHz": "144",
    "432 MHz": "432",
    "1,3 GHz": "1296",
    "2,3 GHz": "2320",
    "3,4 GHz": "3400",
    "5,7 GHz": "5760",
    "10 GHz": "10368",
    "24 GHz": "24048",
    "47 GHz": "47088",
    "76 GHz": "77500",
    "122 GHz": "122250",
    "134 GHz": "134928",
    "241 GHz": "241920",
    "300 GHz": "submm",
};
// TX mode conversion table
EdiToAdifConverter.TX_MODES = {
    "0": "NON",
    "1": "SSB",
    "2": "CW",
    "3": "CW",
    "4": "SSB",
    "5": "AM",
    "6": "FM",
    "7": "RTTY",
    "8": "SSTV",
    "9": "ATV",
};
// Export individual functions for more granular usage
export const convertEdiToAdif = EdiToAdifConverter.convert;
export const convertEdiFileToAdif = EdiToAdifConverter.convertFromFile;
export const saveAdifToFile = EdiToAdifConverter.saveToFile;
// Default export
export default EdiToAdifConverter;
