import { EncodeCallback, EncodeResponse, TokenCallback, TokenResponse } from "./types";
export declare function decode(token: string, callback?: TokenCallback): TokenResponse;
export declare function encode(userId: string, done?: EncodeCallback): EncodeResponse;
