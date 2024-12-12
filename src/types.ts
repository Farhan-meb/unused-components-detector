export interface ComponentInfo {
    name: string;
    filePath: string;
    isUsed: boolean;
}

export interface DetectorOptions {
    srcPath: string;
    ignore?: string[];
    extensions?: string[];
}
