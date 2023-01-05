import * as utils from "./utils";
import { ConfigOptions } from "./types";

export class Config {
    private options: ConfigOptions = {
        cookieName:  'rememberMe',
        salt:  '91287123kh21jkkjb2eh89duas9has',
        keyName: "remember-me",
        successRedirect: undefined,
        cookie:  {
            path: '/',
            httpOnly: true,
            maxAge: 604800000 // maxAge: 7 days
        }
    };
    private static instance: Config;
    private constructor(options: any) {
        if (!options.salt) {
            throw new Error('Must provide e unique salt string to secure tokens.')
        }

        utils.merge(this.options, options);
    }
    static create(options: any) {
        this.instance = new Config(options);
    }
    static merge(options: any) {
        return utils.merge(this.instance.options, options);
    }
    static get<T>(key: keyof ConfigOptions): T {
        return this.instance.options[key] as T
    }
}