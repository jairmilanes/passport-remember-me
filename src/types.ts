import { CookieOptions, Request, Response, NextFunction } from "express"
import {JwtPayload} from "jsonwebtoken";

export interface User {
    id: string|number;
    [key: string]: any;
}

export interface ConfigOptions {
    salt: string;
    cookieName: string;
    cookie: CookieOptions;
    keyName: string;
    successRedirect?: string;
    logErrors?: boolean;
}

export interface RememberMeOptions {
    /**
     * Unique salt string used to generate tokens.
     * @required
     */
    salt: string;
    /**
     * The name assign to cookies
     * @default rememberMe
     */
    cookieName?: string;
    /**
     * Cookie configuration, passed to cookie-parser.
     *
     * @default {
     *     path: '/',
     *     httpOnly: true,
     *     maxAge: 604800000 // maxAge: 7 days
     * }
     */
    cookie?: CookieOptions;
    /**
     * It looks for this key name in the request body, make sure
     * to name your remember-me field the same.
     *
     * @default remember-me
     */
    keyName?: string;
    /**
     * The success redirect route
     *
     * @default undefined
     */
    successRedirect?: string;
    /**
     * A custom logger, you may also pass true to fallback
     * to console.log, leaving it undefined will not log anything.
     */
    logger?: boolean | GenericLoggerInterface;
}

export interface GenericLoggerInterface {
    log: (...args: any[]) => void;
}

export type RefreshCallback = (err?: Error | null, user?: any) => void;
export type GetUserCallback = (userId: any, token: string, done: RefreshCallback) => void;
export type TokenResponse = { error?: Error, payload?: string | JwtPayload }
export type TokenCallback = (error?: Error, payload?: string | JwtPayload) => void
export type EncodeResponse = { error?: Error, token?: string }
export type EncodeCallback = (err?: any, token?: any) => void;
export type TokenSavedCallback = (error?: Error) => void;
export type SaveTokenCallback = (token: string, userId: string, done: TokenSavedCallback) => void;