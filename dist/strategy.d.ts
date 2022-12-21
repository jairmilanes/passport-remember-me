/**
 * Module dependencies.
 */
import { Strategy } from "passport-strategy";
import { Request } from "express";
import { GenericObject, IssueFunction, RememberMeOptions, VerifyFunction } from "./types";
/**
 * `Strategy` constructor.
 *
 * @param {Object} options
 * @param {function} verify
 * @param {function} issue
 * @api public
 */
export declare class RememberMeStrategy extends Strategy {
    /**
     * Strategy name, used to identify it within passport.
     */
    name: string;
    /**
     * Key used to name the remember me token,
     * will fallback to Strategy name if none is provided.
     */
    _key: string;
    /**
     * Strategy options object, including cookie configuration.
     * Customize it by passing one to the constructor.
     */
    _opts: GenericObject;
    private readonly _verify;
    private readonly _issue;
    private _req?;
    private _user;
    private _info;
    constructor(options: RememberMeOptions | VerifyFunction, verify: VerifyFunction | IssueFunction, issue?: IssueFunction);
    authenticate(req: Request): void;
    /**
     * Token verified callback, will pass if no user is returned
     * or request a new token to be issued if a user was returned
     * from verify.
     */
    private verified;
    /**
     * Token issued callback, creates a new cookie with the freshlly
     * issued token and authenticate the user.
     */
    private issued;
}
