export interface VideoCompressorPayload {
    tempFilePath: string;
    name: string;
}

export interface VideoCompressorResponse {
    errorStr?: string;
    outputPath?: string;
}
