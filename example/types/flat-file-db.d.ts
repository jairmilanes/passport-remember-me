

declare module "flat-file-db" {
    export interface DatabaseOptions {
        fsync?: boolean;
    }
    export interface Database {
        new (path: string, options?: DatabaseOptions): Database;
        open(path: string, options?: DatabaseOptions): void;
        openSync(path: string, options?: DatabaseOptions): void;
        put(key: string, val: any, cb?: (err?: Error) => void): void;
        del(key: string, cb?: (err?: Error) => void): void;
        get<T>(key: string): T;
        has(key: string);
        keys(): string[];
        close(): void;
        clear(): void;
        on(type: string, cb: (error?: Error, data?: any) => void)
    }

    const open = (path: string, options?: DatabaseOptions): Database => Database;

    open.sync = (path: string, options?: DatabaseOptions): Database => Database;

    export default open;
}
