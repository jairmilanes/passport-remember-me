"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encode = exports.decode = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("./config");
function decode(token, callback) {
    const result = { error: undefined, payload: undefined };
    try {
        const decoded = (0, jsonwebtoken_1.verify)(token, config_1.Config.get('salt'));
        result.payload = decoded.userId;
        if (typeof callback === "function") {
            callback(undefined, result.payload);
        }
        return result;
    }
    catch (e) {
        result.error = e;
        if (typeof callback === "function") {
            callback(e);
        }
        return result;
    }
}
exports.decode = decode;
function encode(userId, done) {
    const result = { error: undefined, token: undefined };
    try {
        result.token = (0, jsonwebtoken_1.sign)({ userId, rd: Date.now() }, config_1.Config.get('salt'));
        if (typeof done === "function") {
            done(undefined, result.token);
        }
        return result;
    }
    catch (e) {
        result.error = e;
        if (typeof done === "function") {
            done(result.error);
        }
        return result;
    }
}
exports.encode = encode;
