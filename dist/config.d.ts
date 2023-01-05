import { ConfigOptions } from "./types";
export declare class Config {
    private options;
    private static instance;
    private constructor();
    static create(options: any): void;
    static merge(options: any): any;
    static get<T>(key: keyof ConfigOptions): T;
}
