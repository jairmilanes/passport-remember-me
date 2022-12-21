/**
 * Module dependencies.
 */
import {Strategy} from "passport-strategy";
import { Request } from "express";
import {GenericObject, IssueFunction, RememberMeOptions, VerifyFunction} from "./types";
import * as utils from "./utils";


/**
 * `Strategy` constructor.
 *
 * @param {Object} options
 * @param {function} verify
 * @param {function} issue
 * @api public
 */
export class RememberMeStrategy extends Strategy {

  /**
   * Strategy name, used to identify it within passport.
   */
  name = 'remember-me';
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
  private readonly _verify: VerifyFunction;
  private readonly _issue: IssueFunction;
  private _req?: Request;
  private _user: any;
  private _info: any;

  constructor(options: RememberMeOptions | VerifyFunction, verify: VerifyFunction | IssueFunction, issue?: IssueFunction) {
    super();

    if (typeof options === 'function') {
      issue = verify;
      verify = options;
      options = {};
    }

    if (!verify) throw new Error('remember me cookie authentication strategy requires a verify function');

    if (!issue) throw new Error('remember me cookie authentication strategy requires an issue function');

    const { key, cookie } = options;

    this._key = key || this.name;

    const opts = { path: '/', httpOnly: true, maxAge: 604800000 }; // maxAge: 7 days

    this._opts = utils.merge(opts, cookie);

    this._verify = verify;
    this._issue = issue;
  }

  authenticate(req: Request) {
    this._req = req;
    this._user = null;
    this._info = null;

    // User already authenticated, pass...
    if (req.isAuthenticated()) {
      return this.pass();
    }

    const token = this._req.cookies[this._key];

    // No previous cookie, no verification needed, pass...
    if (!token) { return this.pass(); }

    // Request cookie verification...
    this._verify(token, this.verified.bind(this));
  }

  /**
   * Token verified callback, will pass if no user is returned
   * or request a new token to be issued if a user was returned
   * from verify.
   */
  private verified(err?: Error | null, user?: any, info?: any) {
    if (err) { return this.error(err); }

    if (!user) {
      // Token did not evaluate to an existing user
      // pass and allow for other authentication methods.
      this._req?.res?.clearCookie(this._key);

      return this.pass();
    }

    // Token was valid and returned a user
    this._user = user;
    this._info = info;

    // Must re-issue the token for security purpouses
    this._issue(user, this.issued.bind(this));
  }

  /**
   * Token issued callback, creates a new cookie with the freshlly
   * issued token and authenticate the user.
   */
  private issued(error?: Error | null, token?: string | null) {
    if (error) { return this.error(error); }

    this._req?.res?.cookie(this._key, token, this._opts);

    return this.success(this._user, this._info);
  }
}
