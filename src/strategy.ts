import {Strategy as BaseStrategy} from "passport-strategy";
import {Request} from "express";
import {
  GenericLoggerInterface,
  GetUserCallback,
  RememberMeOptions,
  SaveTokenCallback
} from "./types";
import {decode, encode} from "./token";
import {Config} from "./config";

/**
 * `Strategy` constructor.
 *
 * @param {Object} options
 * @param {function} verify
 * @param {function} issue
 * @api public
 */
export class Strategy extends BaseStrategy {
  name = "rememberMe";
  private _req?: Request;

  readonly getUser: GetUserCallback;
  readonly saveToken: SaveTokenCallback;

  private logger?: GenericLoggerInterface;

  constructor(options: RememberMeOptions, getUser: GetUserCallback, saveToken: SaveTokenCallback) {
    super();

    if (!getUser || !saveToken) {
      throw new Error("Must provide a getUser and saveToken callback.")
    }

    const { logger, ...rest } = options;

    Config.create(rest);

    this.getUser = getUser;
    this.saveToken = saveToken;

    if (typeof logger !== "boolean" && logger?.log) {
      this.logger = logger
    }

    if (typeof logger === "boolean" && logger) {
      this.logger = {
        log: (message: string, error?: Error) => console.warn(message, error)
      };
    }
  }

  async authenticate(req: Request, options?: Partial<RememberMeOptions>) {
    this._req = req;

    Config.merge(options || {});

    // User already authenticated, pass...
    if (req.isAuthenticated()) {
      return this.pass();
    }

    const token = req.cookies[Config.get<string>("cookieName")] || null;

    // No previous cookie, no verification needed, pass...
    if (!token) {
      return this.pass();
    }

    const { error, payload } = decode(token);

    if (error) {
      this.logger?.log("Remember Me: Token decode error, skipping...", token, error);
      return this.pass();
    }

    // Request cookie verification...
    await this.getUser(payload, token, this.refresh.bind(this));
  }

  /**
   * Token verified callback, will pass if no user is returned
   * or request a new token to be issued if a user was returned
   * from verify.
   */
  private refresh(error?: Error | null, user?: any, info?: any) {
    if (error) {
      this.logger?.log("Remember Me: Get user error, skipping...", error);
      return this.pass();
    }

    this._req?.res?.clearCookie(Config.get("cookieName"));

    if (!user) {
      this.logger?.log("Remember Me: User not found, skipping...", error);
      // Token did not evaluate to an existing user
      // pass and allow for other authentication methods.
      return this.pass();
    }

    const { error: encodeError, token } = encode(user.id);

    if (encodeError) {
      this.logger?.log("Remember Me: Token encode error, skipping...", error);
      return this.pass();
    }

    this.saveToken(token as string, user.id, (error?: Error) => {
      if (error) {
        this.logger?.log("Remember Me: Save token error, skipping...", error);
        // Saving token failed, pass instead of error
        // pass and allow for other authentication methods.
        this.pass();
      }

      this._req?.res?.cookie(Config.get("cookieName"), token, Config.get("cookie"));

      if (this._req?.session) {
        this._req.session.rememberMe = true;
      }

      return this.success(user, info);
    })
  }
}

