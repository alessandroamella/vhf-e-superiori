export interface QrzReturnData {
  QRZDatabase: OkQrzDatabase | ErrorQrzDatabase;
}

export interface OkQrzDatabase {
  $: GeneratedType;
  Callsign: [Callsign];
  Session: [OkSession];
}

export interface ErrorQrzDatabase {
  $: GeneratedType;
  Session: [ErrorSession];
}

export interface GeneratedType {
  version: string;
  xmlns: string;
}

export interface Callsign {
  call: [string];
  dxcc: [string];
  fname: [string];
  name: [string];
  addr1: [string];
  addr2: [string];
  state: [string];
  zip: [string];
  country: [string];
  lat: [string];
  lon: [string];
  grid: [string];
  ccode: [string];
  land: [string];
  class: [string];
  qslmgr: [string];
  email: [string];
  u_views: [string];
  bio: [string];
  biodate: [string];
  image: [string];
  imageinfo: [string];
  moddate: [string];
  eqsl: [string];
  cqzone: [string];
  ituzone: [string];
  born: [string];
  lotw: [string];
  geoloc: [string];
  name_fmt: [string];
}

interface BaseSession {
  GMTime: [string];
  Remark: [string];
}

export interface OkSession extends BaseSession {
  Key: [string];
  Count: [string];
  SubExp: [string];
}

export interface ErrorSession extends BaseSession {
  Error: string[];
}

export interface QrzMappedData {
  callsign: string;
  name?: string;
  email?: string;
  pictureUrl?: string;
  address?: string;
  town?: string;
  zip?: string;
  country?: string;
  lat?: number;
  lon?: number;
  locator?: string;
}
