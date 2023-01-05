import * as ex from "express";
import jsonwebtoken from "jsonwebtoken";
import {CookieOptions} from "express";
import {
  Strategy as RememberMeStrategy,
  RefreshCallback,
  RememberMeOptions,
  TokenSavedCallback
} from "../src";
import {Config} from "../src/config";
import * as tokenMng from "../src/token";
import {decode, encode} from "../src/token";

describe('Passport Remember-Me', function() {
  let user = { id: "user_id" };
  let req: ex.Request;
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

  it('should export version', function() {
    expect(true).toEqual(true)
  });
    
  it('should export Strategy', function() {
    expect(RememberMeStrategy).toBeDefined()
  });

  describe('Token', () => {
    beforeEach(() => {
      Config.create(options)
    })

    it('should encode/decode a token', () => {
      const encoded = encode(user.id);

      expect(encoded.error).toBeUndefined();
      expect(encoded.token).not.toBeUndefined();

      const decoded = decode(encoded.token as string);

      expect(decoded.error).toBeUndefined();
      expect(decoded.payload).toEqual(user.id);
    })

    it('should encode/decode a token using callback', () => {
      const encodeCb = jest.fn();

      encode(user.id, encodeCb);

      expect(encodeCb).toHaveBeenCalled()
      expect(encodeCb.mock.calls[0][0]).toBeUndefined();
      expect(encodeCb.mock.calls[0][1]).not.toBeUndefined();

      const decodeCb = jest.fn();
      decode(encodeCb.mock.calls[0][1] as string, decodeCb);

      expect(decodeCb).toHaveBeenCalled()
      expect(decodeCb.mock.calls[0][0]).toBeUndefined();
      expect(decodeCb.mock.calls[0][1]).not.toBeUndefined();
      expect(decodeCb.mock.calls[0][1]).toEqual(user.id);
    })

    it('should return error if token is invalid', () => {
      const signSpy = jest.spyOn(jsonwebtoken, "sign");

      signSpy.mockImplementationOnce(() => {
        throw new Error("Test");
      })

      // @ts-ignore
      const encoded = encode(user.id);

      expect(encoded.error).not.toBeUndefined();
      expect(encoded.token).toBeUndefined();

      const verifySpy = jest.spyOn(jsonwebtoken, "verify");

      verifySpy.mockImplementationOnce(() => {
        throw new Error("Test");
      })

      // @ts-ignore
      const decoded = decode("iadhiadh");

      expect(decoded.error).not.toBeUndefined();
      expect(decoded.payload).not.toEqual(user.id);
    })
  })

  describe('Strategy', () => {
    beforeEach(() => {
      // @ts-ignore
      req = new ex.Request();
      req.cookies[cookieName] = cookieToken
    })

    afterEach(() => {
      jest.resetAllMocks()
      jest.restoreAllMocks()
      delete req.cookies[cookieName];
    })

    it('should throw if callbacks are not provided', function() {
      expect(() => {
        // @ts-ignore
        new RememberMeStrategy({}, () => null, null)
      }).toThrow()

      expect(() => {
        // @ts-ignore
        new RememberMeStrategy(null, () => null)
      }).toThrow()
    });

    it('should set properties from options object', function() {
      const instance = new RememberMeStrategy(options, () => null, () => null);
      expect(Config.get("salt")).toEqual(options.salt);
      expect(Config.get("cookieName")).toEqual(options.cookieName);
      expect(Config.get("keyName")).toEqual(options.keyName);
      expect(Config.get("successRedirect")).toEqual(options.successRedirect);
      expect(Config.get<CookieOptions>("cookie")).toEqual(options.cookie);
    });

    it('should pass if request is authenticated', function() {
      const instance = new RememberMeStrategy(options, (userId: string) => null, (token: string) => null);

      jest.mocked(req.isAuthenticated).mockReturnValueOnce(true);
      instance.authenticate(req);

      expect(instance.pass).toHaveBeenCalledTimes(1);
    });

    it('should pass if request has no token', function() {
      const instance = new RememberMeStrategy(options, () => null, () => null);

      delete req.cookies[cookieName]

      instance.authenticate(req);

      expect(instance.pass).toHaveBeenCalledTimes(1);
    });

    it('should pass if decoding a user returns an error', function () {
      const error = new Error("");
      const decode = jest.spyOn(tokenMng, "decode");

      decode.mockImplementationOnce(() => ({ error }));

      const instance = new RememberMeStrategy(options, () => null, () => null);

      instance.authenticate(req);

      expect(instance.pass).toHaveBeenCalledTimes(1);
    });

    it('should call getUser after decoding the token', function () {
      const getUser = jest.fn();

      const instance = new RememberMeStrategy(options, getUser, () => null);

      req.cookies[cookieName] = cookieToken;

      instance.authenticate(req);

      expect(getUser).toHaveBeenCalledTimes(1);
      expect(getUser.mock.calls[0][0]).toEqual(user.id);
    });

    it('should refresh the token if getUser was successfull', function () {
      const encode = jest.spyOn(tokenMng, "encode");

      const getUser = jest.fn().mockImplementationOnce((userId: string, token: string, done: RefreshCallback) => {
        done(null, user);
      });

      const saveToken = jest.fn().mockImplementationOnce((token: string, userId: string, done: TokenSavedCallback) => {
        done();
      });

      const instance = new RememberMeStrategy(options, getUser, saveToken);

      req.cookies[cookieName] = cookieToken;

      instance.authenticate(req);

      expect(getUser).toHaveBeenCalledTimes(1);
      expect(req.res?.clearCookie).toHaveBeenCalledTimes(1);
      expect(encode).toHaveBeenCalledWith(user.id);
      expect(saveToken).toHaveBeenCalledTimes(1);
      expect(saveToken.mock.calls[0][0]).not.toBeUndefined();
      expect(saveToken.mock.calls[0][0]).not.toEqual(cookieToken);
      expect(saveToken.mock.calls[0][1]).toEqual(user.id);
    });

    it('should pass if saveToken returns an error', function () {
      const error = new Error('test');

      const getUser = jest.fn().mockImplementationOnce((userId: string, token: string, done: RefreshCallback) => {
        done(null, user);
      });

      const saveToken = jest.fn().mockImplementationOnce((token: string, userId: string, done: TokenSavedCallback) => {
        done(error);
      });

      const instance = new RememberMeStrategy(options, getUser, saveToken);

      instance.authenticate(req);

      expect(instance.pass).toHaveBeenCalled();
    });

    it('should create a cookie with the token returned from issue', function () {
      const getUser = jest.fn().mockImplementationOnce((userId: string, token: string, done: RefreshCallback) => {
        done(null, user);
      });

      const saveToken = jest.fn().mockImplementationOnce((token: string, userId: string, done: TokenSavedCallback) => {
        done();
      });

      const instance = new RememberMeStrategy(options, getUser, saveToken);

      instance.authenticate(req);

      expect(req?.res?.cookie).toHaveBeenCalledWith(
          Config.get("cookieName"),
          saveToken.mock.calls[0][0],
          Config.get("cookie")
      );
      expect(instance.success).toHaveBeenCalledWith(user, undefined);
    });
  });
});
