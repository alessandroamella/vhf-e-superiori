// Define interfaces for the parsed EDI log structure
interface EdiHeader {
  fileIdentifier: string;
  fileVersion: string;
  TName?: string;
  TDate?: string; // YYYYMMDD;YYYYMMDD
  PCall?: string;
  PWWLo?: string;
  PExch?: string;
  PAdr1?: string;
  PAdr2?: string;
  PSect?: string;
  PBand?: string; // e.g., "144 MHz"
  PClub?: string;
  RName?: string;
  RCall?: string;
  RAdr1?: string;
  RAdr2?: string;
  RPoCo?: string;
  RCity?: string;
  RCoun?: string;
  RPhon?: string;
  RHBBS?: string;
  MOpe1?: string; // Semicolon separated
  MOpe2?: string; // Semicolon separated
  STXEq?: string;
  SPowe?: string; // [W]
  SRXEq?: string;
  SAnte?: string;
  SAntH?: string; // [m];[m]
  CQSOs?: string; // num_qso;band_mult
  CQSOP?: string;
  CWWLs?: string; // num_wwl;bonus;mult
  CWWLB?: string;
  CExcs?: string; // num_exch;bonus;mult
  CExcB?: string;
  CDXCs?: string; // num_dxcc;bonus;mult
  CDXCB?: string;
  CToSc?: string;
  CODXC?: string; // Call;WWL;distance
}

interface EdiQsoRecord {
  date: string; // YYMMDD
  time: string; // HHMM or HHMMSS
  call: string;
  modeCode: string;
  sentRST: string;
  sentQsoNumber: string;
  receivedRST: string;
  receivedQsoNumber: string;
  receivedExchange: string;
  receivedWWL: string;
  qsoPoints: string;
  newExchange: string; // N or empty
  newWWL: string; // N or empty
  newDXCC: string; // N or empty
  duplicateQSO: string; // D or empty
}

// interface ParsedEdiLog {
//   header: EdiHeader;
//   remarks: string[];
//   qsoRecords: EdiQsoRecord[];
// }

// Define interface for internal ADIF field representation
interface AdifField {
  name: string;
  value: string;
  type?: string; // 'D' for Date, 'M' for Multi-line. For character data, type is often omitted in ADIF.
}

/**
 * Formats a single ADIF field into the <FIELDNAME:LENGTH:TYPE>DATA format.
 * Omits the field if its value is empty or null/undefined.
 *
 * @param name The name of the ADIF field.
 * @param value The value of the ADIF field.
 * @param type An optional type indicator (e.g., 'D' for Date, 'M' for Multi-line).
 * @returns The formatted ADIF field string, or an empty string if the value is empty.
 */
const formatAdifField = (
  name: string,
  value: string | null | undefined,
  type?: string,
): string => {
  if (value === null || value === undefined || value.trim() === "") {
    return "";
  }
  const typeStr = type ? `:${type}` : "";
  const trimmedValue = value.trim();
  return `<${name.toUpperCase()}:${trimmedValue.length}${typeStr}>${trimmedValue}`;
};

/**
 * Maps an EDI mode code to its corresponding ADIF mode string.
 *
 * @param ediModeCode The numeric EDI mode code.
 * @returns The ADIF mode string.
 */
const ediModeToAdifMode = (ediModeCode: string): string => {
  switch (ediModeCode) {
    case "0":
      return "OTHER";
    case "1":
      return "SSB";
    case "2":
      return "CW";
    case "3":
      return "SSB"; // EDI: SSB TX, CW RX. ADIF uses primary mode, assuming SSB is primary.
    case "4":
      return "CW"; // EDI: CW TX, SSB RX. ADIF uses primary mode, assuming CW is primary.
    case "5":
      return "AM";
    case "6":
      return "FM";
    case "7":
      return "RTTY";
    case "8":
      return "SSTV";
    case "9":
      return "ATV";
    default:
      return ""; // Return empty for unknown or blank codes
  }
};

/**
 * Converts an EDI date (YYMMDD) to ADIF date (YYYYMMDD).
 * Assumes 2-digit years '70' through '99' are in the 1900s, and '00' through '69' are in the 2000s.
 *
 * @param ediDate The EDI date string (YYMMDD).
 * @returns The ADIF date string (YYYYMMDD).
 */
const formatEdiDateToAdifDate = (ediDate: string): string => {
  if (!ediDate || ediDate.length !== 6) return "";
  const yearPart = parseInt(ediDate.substring(0, 2), 10);
  const century = yearPart >= 70 ? "19" : "20";
  return century + ediDate;
};

/**
 * Converts an EDI time (HHMM or HHMMSS) to ADIF time (HHMMSS).
 * Pads HHMM with '00' for seconds if necessary.
 *
 * @param ediTime The EDI time string.
 * @returns The ADIF time string (HHMMSS).
 */
const formatEdiTimeToAdifTime = (ediTime: string): string => {
  if (!ediTime) return "";
  if (ediTime.length === 4) {
    return `${ediTime}00`; // Pad with seconds
  }
  return ediTime;
};

/**
 * Maps an EDI PBand (e.g., "144 MHz") to a standard ADIF band string (e.g., "2M").
 *
 * @param ediPBand The EDI PBand string from the header.
 * @returns The corresponding ADIF band string.
 */
const ediBandToAdifBand = (ediPBand: string): string => {
  const trimmedBand = ediPBand.trim();
  switch (trimmedBand) {
    case "50 - 54 MHz":
    case "50 MHz":
      return "6M";
    case "70 - 70,5 MHz":
    case "70 MHz":
      return "4M"; // Common regional band
    case "144 - 148 MHz":
    case "145 MHz":
      return "2M";
    case "430 - 440 MHz":
    case "435 MHz":
      return "70CM";
    case "1240 - 1300 MHz":
    case "1,3 GHz":
      return "23CM";
    case "2300 - 2450 MHz":
    case "2,3 GHz":
      return "13CM";
    case "3400 - 3600 MHz":
    case "3,4 GHz":
      return "9CM";
    case "5650 - 5850 MHz":
    case "5,7 GHz":
      return "6CM";
    case "10,0 - 10,5 GHz":
    case "10 GHz":
      return "3CM";
    case "24,0 - 24,25 GHz":
    case "24 GHz":
      return "1.25CM";
    case "- 47,2 GHz": // EDI text contains this, ADIF has "47 GHz" for 6MM
    case "47 GHz":
      return "6MM";
    case "75,5 - 81 GHz":
    case "76 GHz":
      return "4MM";
    case "120 - 120 GHz":
    case "120 GHz":
      return "2.5MM";
    case "142 - 148 GHz":
    case "144 GHz":
      return "2MM";
    case "241 - 250 GHz":
    case "248 GHz":
      return "1MM";
    default:
      return trimmedBand; // Use as is if no specific mapping
  }
};

/**
 * Converts an EDI log content string to an ADIF log content string.
 *
 * @param ediContent The raw string content of the EDI log file.
 * @returns The converted ADIF log content string.
 */
export function convertEdiToAdif(ediContent: string): string {
  const lines = ediContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let currentSection: "header" | "remarks" | "qso" | null = null;
  const ediHeader: EdiHeader = { fileIdentifier: "", fileVersion: "" };
  const ediRemarks: string[] = [];
  const ediQsoRecords: EdiQsoRecord[] = [];

  // Parse the EDI content
  for (const line of lines) {
    if (line.startsWith("[REG1TEST;1]")) {
      ediHeader.fileIdentifier = "REG1TEST";
      ediHeader.fileVersion = "1";
      currentSection = "header";
      continue;
    } else if (line.startsWith("[Remarks]")) {
      currentSection = "remarks";
      continue;
    } else if (line.startsWith("[QSORecords;")) {
      currentSection = "qso";
      continue;
    }

    if (currentSection === "header") {
      const parts = line.split("=", 2);
      if (parts.length === 2) {
        const key = parts[0].trim() as keyof EdiHeader;
        const value = parts[1].trim();
        // Special handling for semicolon-separated values in EDI header, if any
        // The interface properties implicitly handle them as string
        ediHeader[key] = value;
      }
    } else if (currentSection === "remarks") {
      ediRemarks.push(line);
    } else if (currentSection === "qso") {
      const fields = line.split(";");
      if (fields.length >= 15) {
        // Ensure all 15 expected fields/placeholders are present
        const qso: EdiQsoRecord = {
          date: fields[0] || "",
          time: fields[1] || "",
          call: fields[2] || "",
          modeCode: fields[3] || "",
          sentRST: fields[4] || "",
          sentQsoNumber: fields[5] || "",
          receivedRST: fields[6] || "",
          receivedQsoNumber: fields[7] || "",
          receivedExchange: fields[8] || "",
          receivedWWL: fields[9] || "",
          qsoPoints: fields[10] || "",
          newExchange: fields[11] || "",
          newWWL: fields[12] || "",
          newDXCC: fields[13] || "",
          duplicateQSO: fields[14] || "",
        };
        ediQsoRecords.push(qso);
      }
    }
  }

  // ADIF Generation
  const adifOutput: string[] = [];
  const adifHeaderFields: AdifField[] = [];

  // Standard ADIF header fields
  adifHeaderFields.push({ name: "ADIF_VER", value: "1.00" });
  adifHeaderFields.push({ name: "PROGRAMID", value: "EDI-ADIF Converter" });
  adifHeaderFields.push({ name: "PROGRAMVERSION", value: "1.0" });

  // Map EDI header fields to ADIF header fields (including custom ones)
  if (ediHeader.TName)
    adifHeaderFields.push({ name: "CONTEST_ID", value: ediHeader.TName });
  if (ediHeader.TDate) {
    const dates = ediHeader.TDate.split(";");
    if (dates[0])
      adifHeaderFields.push({
        name: "CONTEST_START_DATE",
        value: formatEdiDateToAdifDate(dates[0]),
        type: "D",
      });
    if (dates[1])
      adifHeaderFields.push({
        name: "CONTEST_END_DATE",
        value: formatEdiDateToAdifDate(dates[1]),
        type: "D",
      });
  }
  if (ediHeader.PCall)
    adifHeaderFields.push({ name: "MY_CALL", value: ediHeader.PCall });
  if (ediHeader.PWWLo)
    adifHeaderFields.push({ name: "MY_GRIDSQUARE", value: ediHeader.PWWLo });
  if (ediHeader.PExch)
    adifHeaderFields.push({ name: "MY_EXCHANGE", value: ediHeader.PExch });
  if (ediHeader.PAdr1)
    adifHeaderFields.push({ name: "MY_ADDRESS_LINE1", value: ediHeader.PAdr1 });
  if (ediHeader.PAdr2)
    adifHeaderFields.push({ name: "MY_ADDRESS_LINE2", value: ediHeader.PAdr2 });
  if (ediHeader.PSect)
    adifHeaderFields.push({ name: "CONTEST_SECTION", value: ediHeader.PSect });
  // PBand is used per QSO record, not typically a header field in ADIF
  if (ediHeader.PClub)
    adifHeaderFields.push({ name: "MY_CLUB", value: ediHeader.PClub });

  if (ediHeader.RName)
    adifHeaderFields.push({ name: "OPERATOR_NAME", value: ediHeader.RName });
  if (ediHeader.RCall)
    adifHeaderFields.push({ name: "OPERATOR", value: ediHeader.RCall }); // ADIF OPERATOR is Callsign
  if (ediHeader.RAdr1)
    adifHeaderFields.push({
      name: "OPERATOR_ADDRESS_LINE1",
      value: ediHeader.RAdr1,
    });
  if (ediHeader.RAdr2)
    adifHeaderFields.push({
      name: "OPERATOR_ADDRESS_LINE2",
      value: ediHeader.RAdr2,
    });
  if (ediHeader.RPoCo)
    adifHeaderFields.push({
      name: "OPERATOR_POSTAL_CODE",
      value: ediHeader.RPoCo,
    });
  if (ediHeader.RCity)
    adifHeaderFields.push({ name: "OPERATOR_CITY", value: ediHeader.RCity });
  if (ediHeader.RCoun)
    adifHeaderFields.push({ name: "OPERATOR_COUNTRY", value: ediHeader.RCoun });
  if (ediHeader.RPhon)
    adifHeaderFields.push({ name: "OPERATOR_PHONE", value: ediHeader.RPhon });
  if (ediHeader.RHBBS)
    adifHeaderFields.push({ name: "EMAIL", value: ediHeader.RHBBS }); // ADIF has EMAIL field

  if (ediHeader.MOpe1)
    adifHeaderFields.push({ name: "MULTI_OPERATOR_1", value: ediHeader.MOpe1 });
  if (ediHeader.MOpe2)
    adifHeaderFields.push({ name: "MULTI_OPERATOR_2", value: ediHeader.MOpe2 });

  if (ediHeader.STXEq)
    adifHeaderFields.push({ name: "MY_RIG", value: ediHeader.STXEq });
  if (ediHeader.SPowe)
    adifHeaderFields.push({ name: "TX_PWR", value: ediHeader.SPowe });
  if (ediHeader.SRXEq)
    adifHeaderFields.push({ name: "MY_RX_EQUIPMENT", value: ediHeader.SRXEq });
  if (ediHeader.SAnte)
    adifHeaderFields.push({ name: "MY_ANTENNA", value: ediHeader.SAnte });
  if (ediHeader.SAntH) {
    const heights = ediHeader.SAntH.split(";");
    if (heights[0])
      adifHeaderFields.push({
        name: "MY_ANTENNA_HEIGHT_GROUND",
        value: heights[0],
      });
    if (heights[1])
      adifHeaderFields.push({
        name: "MY_ANTENNA_HEIGHT_SEALVL",
        value: heights[1],
      });
  }

  if (ediHeader.CQSOs)
    adifHeaderFields.push({
      name: "CLAIMED_QSO_COUNT",
      value: ediHeader.CQSOs.split(";")[0],
    });
  if (ediHeader.CQSOP)
    adifHeaderFields.push({
      name: "CLAIMED_QSO_POINTS",
      value: ediHeader.CQSOP,
    });
  if (ediHeader.CWWLs)
    adifHeaderFields.push({
      name: "CLAIMED_WWL_COUNT",
      value: ediHeader.CWWLs.split(";")[0],
    });
  if (ediHeader.CWWLB)
    adifHeaderFields.push({
      name: "CLAIMED_WWL_BONUS",
      value: ediHeader.CWWLB,
    });
  if (ediHeader.CExcs)
    adifHeaderFields.push({
      name: "CLAIMED_EXCHANGE_COUNT",
      value: ediHeader.CExcs.split(";")[0],
    });
  if (ediHeader.CExcB)
    adifHeaderFields.push({
      name: "CLAIMED_EXCHANGE_BONUS",
      value: ediHeader.CExcB,
    });
  if (ediHeader.CDXCs)
    adifHeaderFields.push({
      name: "CLAIMED_DXCC_COUNT",
      value: ediHeader.CDXCs.split(";")[0],
    });
  if (ediHeader.CDXCB)
    adifHeaderFields.push({
      name: "CLAIMED_DXCC_BONUS",
      value: ediHeader.CDXCB,
    });
  if (ediHeader.CToSc)
    adifHeaderFields.push({
      name: "CLAIMED_TOTAL_SCORE",
      value: ediHeader.CToSc,
    });
  if (ediHeader.CODXC) {
    const odxc = ediHeader.CODXC.split(";");
    if (odxc[0]) adifHeaderFields.push({ name: "ODX_CALL", value: odxc[0] });
    if (odxc[1])
      adifHeaderFields.push({ name: "ODX_GRIDSQUARE", value: odxc[1] });
    if (odxc[2])
      adifHeaderFields.push({ name: "ODX_DISTANCE", value: odxc[2] });
  }

  if (ediRemarks.length > 0) {
    adifHeaderFields.push({
      name: "NOTES",
      value: ediRemarks.join("\n"),
      type: "M",
    });
  }

  // Format ADIF header output
  const headerStringParts: string[] = [];
  for (const field of adifHeaderFields) {
    const formattedField = formatAdifField(field.name, field.value, field.type);
    if (formattedField) {
      headerStringParts.push(formattedField);
    }
  }
  adifOutput.push(`${headerStringParts.join("")}<EOH>\n`);

  // Convert EDI QSO records to ADIF QSO records
  for (const ediQso of ediQsoRecords) {
    const qsoFieldStrings: string[] = [];

    // Basic QSO fields
    const adifDate = formatEdiDateToAdifDate(ediQso.date);
    if (adifDate)
      qsoFieldStrings.push(formatAdifField("QSO_DATE", adifDate, "D"));

    const adifTime = formatEdiTimeToAdifTime(ediQso.time);
    if (adifTime) qsoFieldStrings.push(formatAdifField("TIME_ON", adifTime));

    if (ediQso.call) qsoFieldStrings.push(formatAdifField("CALL", ediQso.call));

    // Band (from EDI header's PBand)
    if (ediHeader.PBand) {
      const adifBand = ediBandToAdifBand(ediHeader.PBand);
      if (adifBand) qsoFieldStrings.push(formatAdifField("BAND", adifBand));
    }

    const adifMode = ediModeToAdifMode(ediQso.modeCode);
    if (adifMode) qsoFieldStrings.push(formatAdifField("MODE", adifMode));

    if (ediQso.sentRST)
      qsoFieldStrings.push(formatAdifField("RST_SENT", ediQso.sentRST));
    if (ediQso.sentQsoNumber)
      qsoFieldStrings.push(formatAdifField("STX", ediQso.sentQsoNumber));
    if (ediQso.receivedRST)
      qsoFieldStrings.push(formatAdifField("RST_RCVD", ediQso.receivedRST));
    if (ediQso.receivedQsoNumber)
      qsoFieldStrings.push(formatAdifField("SRX", ediQso.receivedQsoNumber));
    if (ediQso.receivedExchange)
      qsoFieldStrings.push(
        formatAdifField("EXCHANGE_RCVD", ediQso.receivedExchange),
      ); // Custom field
    if (ediQso.receivedWWL)
      qsoFieldStrings.push(formatAdifField("GRIDSQUARE", ediQso.receivedWWL));

    // QSO Points (allow '0' if explicitly present)
    if (
      ediQso.qsoPoints !== null &&
      ediQso.qsoPoints !== undefined &&
      ediQso.qsoPoints !== ""
    ) {
      qsoFieldStrings.push(formatAdifField("QSO_POINTS", ediQso.qsoPoints)); // Custom field
    }

    // Flags and comments
    let qsoComment = "";
    if (ediQso.newExchange === "N")
      qsoFieldStrings.push(formatAdifField("NEW_EXCHANGE", "Y")); // Custom flag
    if (ediQso.newWWL === "N")
      qsoFieldStrings.push(formatAdifField("NEW_GRIDSQUARE", "Y")); // Custom flag
    if (ediQso.newDXCC === "N")
      qsoFieldStrings.push(formatAdifField("NEW_DXCC", "Y")); // Custom flag

    if (ediQso.call === "ERROR") {
      qsoComment = `${qsoComment ? `${qsoComment}; ` : ""}Error QSO in original log`;
    }
    if (ediQso.duplicateQSO === "D") {
      qsoComment = `${qsoComment ? `${qsoComment}; ` : ""}Duplicate QSO`;
    }
    if (qsoComment) {
      qsoFieldStrings.push(formatAdifField("COMMENT", qsoComment));
    }

    // Format ADIF QSO record output
    adifOutput.push(`${qsoFieldStrings.join("")}<EOR>\n`);
  }

  return adifOutput.join("");
}
