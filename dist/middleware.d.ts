import { NextFunction, Request, Response } from "express";
import { SaveTokenCallback } from "./types";
export declare function signOut(redirect?: string): (req: Request, res: Response, next: NextFunction) => void;
export declare function rememberUser(saveToken: SaveTokenCallback): (req: Request, res: Response, next: NextFunction) => void;
