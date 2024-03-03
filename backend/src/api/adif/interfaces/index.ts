export interface ParsedAdif {
    header: Header;
    records: Record[];
}

export interface Header {
    text: string;
    adif_ver: string;
    programid: string;
    programversion: string;
}

export interface Record {
    call: string;
    band: string;
    mode: string;
    qso_date: string;
    time_on: string;
    address?: string;
    ant_az: string;
    ant_el: string;
    comment?: string;
    cont: string;
    country: string;
    cqz: string;
    distance?: string;
    dxcc: string;
    email?: string;
    eqsl_qsl_rcvd: string;
    eqsl_qsl_sent: string;
    freq: string;
    gridsquare?: string;
    ituz: string;
    lotw_qsl_rcvd: string;
    lotw_qsl_sent: string;
    my_city: string;
    my_country: string;
    my_dxcc: string;
    my_gridsquare: string;
    my_rig: string;
    name?: string;
    operator: string;
    station_callsign: string;
    programid: string;
    programversion: string;
    qsl_rcvd: string;
    qsl_rcvd_via: string;
    qsl_sent: string;
    qsl_sent_via: string;
    qsl_via?: string;
    qso_complete: string;
    qso_date_off: string;
    qth?: string;
    rst_rcvd: string;
    rst_sent: string;
    time_off: string;
    tx_pwr?: string;
    lat: string;
    lon: string;
    my_lat: string;
    my_lon: string;
    my_antenna: string;
    pfx: string;
    qso_random: string;
    sfi: string;
    qrzcom_qso_upload_date: string;
    qrzcom_qso_upload_status: string;
    app_l4ong_satellite_qso: string;
    app_l4ong_contest: string;
    app_l4ong_qso_confirmations: string;
    app_l4ong_qso_award_references: string;
    iota?: string;
    state?: string;
    stx?: string;
    stx_string?: string;
    srx_string?: string;
}
