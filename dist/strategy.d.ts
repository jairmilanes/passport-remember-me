import { Strategy as BaseStrategy } from "passport-strategy";
import { Request } from "express";
import { GetUserCallback, RememberMeOptions, SaveTokenCallback } from "./types";
/**
 * `Strategy` constructor.
 *
 * @param {Object} options
 * @param {function} verify
 * @param {function} issue
 * @api public
 */
export declare class Strategy extends BaseStrategy {
    name: string;
    private _req?;
    readonly getUser: GetUserCallback;
    readonly saveToken: SaveTokenCallback;
    private logger?;
    constructor(options: RememberMeOptions, getUser: GetUserCallback, saveToken: SaveTokenCallback);
    authenticate(req: Request, options?: Partial<RememberMeOptions>): Promise<void>;
    /**
     * Token verified callback, will pass if no user is returned
     * or request a new token to be issued if a user was returned
     * from verify.
     */
    private refresh;
}
