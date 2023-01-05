"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Strategy = void 0;
const passport_strategy_1 = require("passport-strategy");
const token_1 = require("./token");
const config_1 = require("./config");
/**
 * `Strategy` constructor.
 *
 * @param {Object} options
 * @param {function} verify
 * @param {function} issue
 * @api public
 */
class Strategy extends passport_strategy_1.Strategy {
    constructor(options, getUser, saveToken) {
        super();
        this.name = "rememberMe";
        if (!getUser || !saveToken) {
            throw new Error("Must provide a getUser and saveToken callback.");
        }
        const { logger } = options, rest = __rest(options, ["logger"]);
        config_1.Config.create(rest);
        this.getUser = getUser;
        this.saveToken = saveToken;
        if (typeof logger !== "boolean" && (logger === null || logger === void 0 ? void 0 : logger.log)) {
            this.logger = logger;
        }
        if (typeof logger === "boolean" && logger) {
            this.logger = {
                log: (message, error) => console.warn(message, error)
            };
        }
    }
    authenticate(req, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this._req = req;
            config_1.Config.merge(options || {});
            // User already authenticated, pass...
            if (req.isAuthenticated()) {
                return this.pass();
            }
            const token = req.cookies[config_1.Config.get("cookieName")] || null;
            // No previous cookie, no verification needed, pass...
            if (!token) {
                return this.pass();
            }
            const { error, payload } = (0, token_1.decode)(token);
            if (error) {
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log("Remember Me: Token decode error, skipping...", token, error);
                return this.pass();
            }
            // Request cookie verification...
            yield this.getUser(payload, token, this.refresh.bind(this));
        });
    }
    /**
     * Token verified callback, will pass if no user is returned
     * or request a new token to be issued if a user was returned
     * from verify.
     */
    refresh(error, user, info) {
        var _a, _b, _c, _d, _e;
        if (error) {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log("Remember Me: Get user error, skipping...", error);
            return this.pass();
        }
        (_c = (_b = this._req) === null || _b === void 0 ? void 0 : _b.res) === null || _c === void 0 ? void 0 : _c.clearCookie(config_1.Config.get("cookieName"));
        if (!user) {
            (_d = this.logger) === null || _d === void 0 ? void 0 : _d.log("Remember Me: User not found, skipping...", error);
            // Token did not evaluate to an existing user
            // pass and allow for other authentication methods.
            return this.pass();
        }
        const { error: encodeError, token } = (0, token_1.encode)(user.id);
        if (encodeError) {
            (_e = this.logger) === null || _e === void 0 ? void 0 : _e.log("Remember Me: Token encode error, skipping...", error);
            return this.pass();
        }
        this.saveToken(token, user.id, (error) => {
            var _a, _b, _c, _d;
            if (error) {
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.log("Remember Me: Save token error, skipping...", error);
                // Saving token failed, pass instead of error
                // pass and allow for other authentication methods.
                this.pass();
            }
            (_c = (_b = this._req) === null || _b === void 0 ? void 0 : _b.res) === null || _c === void 0 ? void 0 : _c.cookie(config_1.Config.get("cookieName"), token, config_1.Config.get("cookie"));
            if ((_d = this._req) === null || _d === void 0 ? void 0 : _d.session) {
                this._req.session.rememberMe = true;
            }
            return this.success(user, info);
        });
    }
}
exports.Strategy = Strategy;
