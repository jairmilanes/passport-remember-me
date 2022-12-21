import { CookieOptions, Request } from "express"

export interface GenericObject {
    [key: string]: string | number | boolean | Array<any> | GenericObject | null | undefined;
}

export interface RememberMeOptions {
    key?: string;
    cookie?: CookieOptions;
}

export type VerifyCallback = (err: any, user?: any, info?: any) => void;

export type VerifyFunction = (token: any, done: VerifyCallback) => void;

export type IssueCallback = (err: any, token?: any) => void;

export type IssueFunction = (user: any, done: IssueCallback) => void;

export type IssueFunctionWithRequest = (req: Request, user: any, done: IssueCallback) => void;