"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RememberMeStrategy = void 0;
/**
 * Module dependencies.
 */
const passport_strategy_1 = require("passport-strategy");
const utils = __importStar(require("./utils"));
/**
 * `Strategy` constructor.
 *
 * @param {Object} options
 * @param {function} verify
 * @param {function} issue
 * @api public
 */
class RememberMeStrategy extends passport_strategy_1.Strategy {
    constructor(options, verify, issue) {
        super();
        /**
         * Strategy name, used to identify it within passport.
         */
        this.name = 'remember-me';
        if (typeof options === 'function') {
            issue = verify;
            verify = options;
            options = {};
        }
        if (!verify)
            throw new Error('remember me cookie authentication strategy requires a verify function');
        if (!issue)
            throw new Error('remember me cookie authentication strategy requires an issue function');
        const { key, cookie } = options;
        this._key = key || this.name;
        const opts = { path: '/', httpOnly: true, maxAge: 604800000 }; // maxAge: 7 days
        this._opts = utils.merge(opts, cookie);
        this._verify = verify;
        this._issue = issue;
    }
    authenticate(req) {
        this._req = req;
        this._user = null;
        this._info = null;
        // User already authenticated, pass...
        if (req.isAuthenticated()) {
            return this.pass();
        }
        const token = this._req.cookies[this._key];
        // No previous cookie, no verification needed, pass...
        if (!token) {
            return this.pass();
        }
        // Request cookie verification...
        this._verify(token, this.verified.bind(this));
    }
    /**
     * Token verified callback, will pass if no user is returned
     * or request a new token to be issued if a user was returned
     * from verify.
     */
    verified(err, user, info) {
        var _a, _b;
        if (err) {
            return this.error(err);
        }
        if (!user) {
            // Token did not evaluate to an existing user
            // pass and allow for other authentication methods.
            (_b = (_a = this._req) === null || _a === void 0 ? void 0 : _a.res) === null || _b === void 0 ? void 0 : _b.clearCookie(this._key);
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
    issued(error, token) {
        var _a, _b;
        if (error) {
            return this.error(error);
        }
        (_b = (_a = this._req) === null || _a === void 0 ? void 0 : _a.res) === null || _b === void 0 ? void 0 : _b.cookie(this._key, token, this._opts);
        return this.success(this._user, this._info);
    }
}
exports.RememberMeStrategy = RememberMeStrategy;
