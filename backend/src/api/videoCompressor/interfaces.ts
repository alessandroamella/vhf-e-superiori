export interface VideoCompressorPayload {
    tempFilePath: string;
    name: string;
    md5: string;
}

export interface VideoCompressorResponse {
    errorStr?: string;
    outputPath?: string;
    percent?: number;
    md5: string;
}
