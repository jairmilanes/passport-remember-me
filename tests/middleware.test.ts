import * as ex from "express";
import {RememberMeOptions, rememberUser, signOut} from "../src";
import * as tokenMng from "../src/token";
import {Config} from "../src/config";

describe("Middleware", () => {
    let user = { id: "user_id" };
    let req: ex.Request;
    let res: ex.Response;
    let next = jest.fn();
    let cookieToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyX2lkIiwicmQiOjE2NzI4NjA5NDg5MjgsImlhdCI6MTY3Mjg2MDk0OH0.-d1EVMxjgFSbLaYh-X3YZoNo4v4ZmUz2NDDxpG7LLfE";
    let cookieName = "TEST";
    let options: RememberMeOptions = {
        salt: "adasdasdasd",
        cookieName,
        keyName: "my-remember-me",
        logger: undefined,
        successRedirect: "/profile",
        cookie: {
            maxAge: 47859,
            secure: true,
            path: '/',
            httpOnly: true,
        }
    };

    beforeEach(() => {
        Config.create(options)
        // @ts-ignore
        req = new ex.Request();
        // @ts-ignore
        res = new ex.Response();
    })

    afterEach(() => {
        jest.resetAllMocks()
        jest.restoreAllMocks()
        delete req.cookies[cookieName];
    })

    describe("signOut", () => {
        it('should clearn cookie and logout', () => {
            signOut('/')(req, res, next);
            expect(res.clearCookie).toHaveBeenCalledWith(Config.get("cookieName"))
            expect(req.logout).toHaveBeenCalled()
            expect(res.redirect).toHaveBeenCalledWith('/')
        });

        it('should call next if no callback is provided', () => {
            signOut()(req, res, next);
            expect(res.clearCookie).toHaveBeenCalledWith(Config.get("cookieName"))
            expect(req.logout).toHaveBeenCalled()
            expect(next).toHaveBeenCalled();
        });
    });

    describe("rememberUser", () => {
        it('should clear cookie and skip if keyName is not in body payload', () => {
            const saveToken = jest.fn();
            const op = {...options};
            const middleware = rememberUser(saveToken);

            middleware(req, res, next);
            expect(res.clearCookie).toHaveBeenCalled()
            expect(res.redirect).toHaveBeenCalledWith(op.successRedirect)


            delete op.successRedirect;
            Config.create(op)

            middleware(req, res, next);
            expect(res.clearCookie).toHaveBeenCalled()
            expect(next).toHaveBeenCalled()
        })

        it('should skip if user is not authenticated', () => {
            const op = { ...options };
            const saveToken = jest.fn();
            const middleware = rememberUser(saveToken);

            req.body[op.keyName as string] = "on";
            req.user = undefined;

            middleware(req, res, next);

            expect(res.clearCookie).not.toHaveBeenCalled()
            expect(res.redirect).toHaveBeenCalledWith(op.successRedirect)

            delete op.successRedirect;
            Config.create(op)

            middleware(req, res, next);

            expect(res.clearCookie).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
            expect(true).toEqual(true);
        })

        it('should skip if error when encoding new token', () => {
            const op = { ...options };
            const saveToken = jest.fn();
            const middleware = rememberUser(saveToken);
            const error = new Error("");
            const encode = jest.spyOn(tokenMng, "encode");

            encode.mockImplementation(() => ({ error }));

            req.body[op.keyName as string] = "on";
            req.user = user;

            middleware(req, res, next);

            expect(encode).toHaveBeenCalledWith((req.user as any).id, op.salt);
            expect(res.redirect).toHaveBeenCalledWith(options.successRedirect);
            expect(saveToken).not.toHaveBeenCalled();

            delete op.successRedirect;

            Config.create(op)
            middleware(req, res, next);

            expect(encode).toHaveBeenCalledWith((req.user as any).id, op.salt);
            expect(next).toHaveBeenCalled();
            expect(saveToken).not.toHaveBeenCalled();
        })

        it('should save new token and continue', () => {
            const op = { ...options };
            const saveToken = jest.fn()
                .mockImplementation((token, userId, done) => {
                    done()
                });
            const middleware = rememberUser(saveToken);

            const encode = jest.spyOn(tokenMng, "encode");

            encode.mockImplementation(() => {
                return { token: cookieToken }
            })

            req.body[op.keyName as string] = "on";
            req.user = user;

            middleware(req, res, next);

            expect(encode).toHaveBeenCalledWith((req.user as any).id, op.salt);
            expect(saveToken.mock.calls[0][0]).toEqual(cookieToken)
            expect(saveToken.mock.calls[0][1]).toEqual((req.user as any).id);
            expect(res.redirect).toHaveBeenCalled();

            delete op.successRedirect;
            Config.create(op)
            middleware(req, res, next);

            expect(encode).toHaveBeenCalledWith((req.user as any).id, op.salt);
            expect(saveToken.mock.calls[0][0]).toEqual(cookieToken)
            expect(saveToken.mock.calls[0][1]).toEqual((req.user as any).id)
            expect(next).toHaveBeenCalled();
        })

        it('should handle thorwn error', () => {
            const op = { ...options };
            const error = new Error("");
            const saveToken = jest.fn()
                .mockImplementation((token, userId, done) => {
                    done()
                });
            const middleware = rememberUser(saveToken);

            const encode = jest.spyOn(tokenMng, "encode");

            encode.mockImplementation(() => {
                throw error
            })

            req.body[op.keyName as string] = "on";
            req.user = user;

            middleware(req, res, next);

            expect(encode).toHaveBeenCalledWith((req.user as any).id, op.salt);
            expect(res.redirect).toHaveBeenCalledWith(options.successRedirect)

            delete op.successRedirect;
            Config.create(op)
            middleware(req, res, next);

            expect(encode).toHaveBeenCalledWith((req.user as any).id, op.salt);
            expect(next).toHaveBeenCalledWith(error);
        })
    })
})