"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merge = void 0;
const merge = function (a = {}, b = {}) {
    for (const key in b) {
        if (b[key] !== null && typeof b[key] === "object") {
            a[key] = (0, exports.merge)(a[key], b[key]);
        }
        else {
            a[key] = b[key];
        }
    }
    return a;
};
exports.merge = merge;
