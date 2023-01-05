"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rememberUser = exports.signOut = void 0;
const token_1 = require("./token");
const config_1 = require("./config");
function signOut(redirect) {
    return (req, res, next) => {
        res.clearCookie(config_1.Config.get("cookieName"));
        return req.logout(() => {
            if (redirect) {
                return res.redirect(redirect);
            }
            next();
        });
    };
}
exports.signOut = signOut;
function redirectOrNext(res, next) {
    if (config_1.Config.get("successRedirect")) {
        return res.redirect(config_1.Config.get("successRedirect"));
    }
    else {
        return next();
    }
}
function rememberUser(saveToken) {
    return (req, res, next) => {
        var _a;
        if (!req.body[config_1.Config.get("keyName")]) {
            res.clearCookie(config_1.Config.get("cookieName"));
            return redirectOrNext(res, next);
        }
        // @ts-ignore
        if (!req.user || !((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return redirectOrNext(res, next);
        }
        try {
            // @ts-ignore
            const { error, token } = (0, token_1.encode)(req.user.id, config_1.Config.get("salt"));
            if (error) {
                return redirectOrNext(res, next);
            }
            res.cookie(config_1.Config.get("cookieName"), token, config_1.Config.get("cookie"));
            // @ts-ignore
            saveToken(token, req.user.id, () => {
                return redirectOrNext(res, next);
            });
        }
        catch (e) {
            if (config_1.Config.get("successRedirect")) {
                return res.redirect(config_1.Config.get("successRedirect"));
            }
            else {
                return next(e);
            }
        }
    };
}
exports.rememberUser = rememberUser;
