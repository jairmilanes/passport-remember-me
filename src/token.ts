import { verify, sign } from "jsonwebtoken";
import {EncodeCallback, EncodeResponse, TokenCallback, TokenResponse} from "./types";
import {Config} from "./config";

export function decode(token: string, callback?: TokenCallback): TokenResponse {
    const result: TokenResponse = { error: undefined, payload: undefined }

    try {
        const decoded: any = verify(token, Config.get<string>('salt'));

        result.payload = decoded.userId;

        if (typeof callback === "function") {
            callback(undefined, result.payload);
        }

        return result;
    } catch(e) {
        result.error = e as Error;

        if (typeof callback === "function") {
            callback(e as Error);
        }

        return result;
    }
}

export function encode(userId: string, done?: EncodeCallback): EncodeResponse {
    const result: EncodeResponse = { error: undefined, token: undefined }

    try {
        result.token = sign({ userId, rd: Date.now() }, Config.get('salt'));

        if (typeof done === "function") {
            done(undefined, result.token);
        }

        return result;
    } catch (e) {
        result.error = e as Error;

        if (typeof done === "function") {
            done(result.error);
        }

        return result;
    }
}