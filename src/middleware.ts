import { NextFunction, Request, Response } from "express";
import { encode } from "./token";
import {Config} from "./config";
import {SaveTokenCallback} from "./types";

export function signOut(redirect?: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        res.clearCookie(Config.get("cookieName"));

        return req.logout(() => {
            if (redirect) {
                return res.redirect(redirect);
            }
            next();
        });
    }
}

function redirectOrNext(res: Response, next: NextFunction) {
    if (Config.get("successRedirect")) {
        return res.redirect(Config.get("successRedirect"));
    } else {
        return next();
    }
}

export function rememberUser(saveToken: SaveTokenCallback): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {

        if (!req.body[Config.get<string>("keyName")]) {
            res.clearCookie(Config.get("cookieName"));
            return redirectOrNext(res, next);
        }

        // @ts-ignore
        if (!req.user || !req.user?.id) {
            return redirectOrNext(res, next);
        }

        try {
            // @ts-ignore
            const { error, token } = encode(req.user.id, Config.get("salt"));

            if (error) {
                return redirectOrNext(res, next);
            }

            res.cookie(Config.get("cookieName"), token, Config.get("cookie"));

            // @ts-ignore
            saveToken(token, req.user.id, () => {
                return redirectOrNext(res, next);
            });
        } catch(e) {
            if (Config.get("successRedirect")) {
                return res.redirect(Config.get("successRedirect"));
            } else {
                return next(e);
            }
        }
    }
}

