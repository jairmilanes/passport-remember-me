import * as ex from "express";
import { RememberMeStrategy } from "../src/index";
import {VerifyCallback} from "../src/types";

describe('Passport Remember-Me', function() {
    
  it('should export version', function() {
    expect(true).toEqual(true)
  });
    
  it('should export Strategy', function() {
    expect(RememberMeStrategy).toBeDefined()
  });

  describe('Strategy', () => {
    let req: ex.Request;
    let cookieToken = "OPIUOIJODSDSSD";
    let key = "TEST";
    let user = { id: "urser_id" };

    beforeEach(() => {
      // @ts-ignore
      req = new ex.Request();
      req.cookies[key] = cookieToken
    })

    it('should throw if callbacks are not provided', function() {
      expect(() => {
        // @ts-ignore
        new RememberMeStrategy(() => null, null)
      }).toThrow()

      expect(() => {
        // @ts-ignore
        new RememberMeStrategy(null, () => null)
      }).toThrow()
    });

    it('should set properties from options object', function() {
      const instance = new RememberMeStrategy({
        key,
        cookie: {
          maxAge: 47859
        }
      }, () => null, () => null)
      expect(instance).toHaveProperty("_key", key);
      expect(instance).toHaveProperty("_opts.maxAge", 47859);
    });

    it('should pass if request is authenticated', function() {
      const instance = new RememberMeStrategy({
        key,
        cookie: {
          maxAge: 47859
        }
      }, () => null, () => null);

      jest.mocked(req.isAuthenticated).mockReturnValueOnce(true);
      instance.authenticate(req);

      expect(instance.pass).toHaveBeenCalledTimes(1);
    });

    it('should pass if request has no token', function() {
      const instance = new RememberMeStrategy({}, () => null, () => null);

      instance.authenticate(req);

      expect(instance.pass).toHaveBeenCalledTimes(1);
    });

    it('should call verified after token verification', function () {
      const verify = jest.fn().mockImplementationOnce((token: string, done: VerifyCallback) => {
        done(null, user);
      });

      const instance = new RememberMeStrategy({ key }, verify, () => null);

      // @ts-ignore
      const spy = jest.spyOn(instance, "verified");

      instance.authenticate(req);

      expect(verify).toHaveBeenCalledTimes(1);
      // @ts-ignore
      expect(spy).toHaveBeenCalledWith(null, user);
    });

    it('should return an error if verify returns an error', function () {
      const error = new Error("test")

      const verify = jest.fn().mockImplementationOnce((token: string, done) => {
        done(error);
      });

      const issue = jest.fn();

      const instance = new RememberMeStrategy({ key }, verify, issue);

      instance.authenticate(req);

      expect(verify).toHaveBeenCalledTimes(1);
      // @ts-ignore
      expect(instance.error).toHaveBeenCalledWith(error);
      expect(issue).not.toHaveBeenCalled();
    });

    it('should request to issue a new token if user exists', function () {
      const token = "asdasdkadkaj";

      const verify = jest.fn().mockImplementationOnce((token: string, done) => {
        done(null, user);
      });

      const issue = jest.fn().mockImplementationOnce((user: string, done) => {
        done(null, token);
      });

      const instance = new RememberMeStrategy({ key }, verify, issue);

      // @ts-ignore
      const issued = jest.spyOn(instance, "issued");

      issued.mockImplementationOnce(() => "");

      instance.authenticate(req);

      expect(verify).toHaveBeenCalledTimes(1);
      expect(issue).toHaveBeenCalledTimes(1);
      // @ts-ignore
      expect(issue.mock.calls[0][0]).toEqual(user);
      // @ts-ignore
      expect(Object.create(instance.issued.prototype)).toBeInstanceOf(issue.mock.calls[0][1]);
      expect(issued).toHaveBeenCalledTimes(1)
      expect(issued).toHaveBeenCalledWith(null, token)
    });

    it('should error if issue callback returns an error', function () {
      const error = new Error('test');

      const verify = jest.fn().mockImplementationOnce((token: string, done) => {
        done(null, user);
      });

      const issue = jest.fn().mockImplementationOnce((user: string, done) => {
        done(error);
      });

      const instance = new RememberMeStrategy({ key }, verify, issue);

      // @ts-ignore
      const issued = jest.spyOn(instance, "issued");

      instance.authenticate(req);

      expect(issue.mock.calls[0][0]).toEqual(user);
      expect(issued).toHaveBeenCalledWith(error);
      expect(instance.error).toHaveBeenCalledWith(error);
    });

    it('should create a cookie with the token returned from issue', function () {
      const token = "asdasdkadkaj";

      const verify = jest.fn().mockImplementationOnce((token: string, done) => {
        done(null, user);
      });

      const issue = jest.fn().mockImplementationOnce((user: string, done) => {
        done(null, token);
      });

      const instance = new RememberMeStrategy({ key }, verify, issue);

      // @ts-ignore
      const issued = jest.spyOn(instance, "issued");

      instance.authenticate(req);

      expect(issue.mock.calls[0][0]).toEqual(user);
      expect(issued).toHaveBeenCalledWith(null, token);
      expect(req.res?.cookie).toHaveBeenCalledWith("TEST", token, instance._opts)
      expect(instance.success).toHaveBeenCalledWith(user, undefined);
    });
  });
});
