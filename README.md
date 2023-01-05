<h1>
<small style="display: block">Passport</small>
Remember Me Strategy
</h1>

[Passport](http://passportjs.org/) strategy for authenticating based on a remember me cookie (persistent login), it can be easilly and unobtrusively integrated into any application
or framework that supports [Connect](http://www.senchalabs.org/connect/)-style middleware, including [Express](http://expressjs.com/).

This is a complete rethink of the [passport-remember-me](https://github.com/jaredhanson/passport-remember-me) strategy created by [Jared Hanson](https://github.com/jaredhanson).

I've wanted to make it easier to use, improve its documentation but ended up completely rethinking it using Typescript.

Now you don't need to worry about generating tokens, only saving them using your preffered persistency strategy, it uses web tokens generated with the user id and a salt string to make it more secure.

The logic is as follows:

- The user logs in through some authentication method in your app (local, basic, token).
- Once they are authenticated, remember me creates a web token using the user id and app salt.
- This token is then passed to a response cookie and sent to the user.
- The next time this user comes to your app, remember me looks for the unexpired cookie.
- Decodes the token and uses the getUser callback passing userId and token so you can find the user in your database.
- If the user is found, remember me authenticates the user and generates a new token and cookie.
- This new cookie is than passed to the saveToken callback for persistency.


## Install

```shell
$ npm install @jmilanes/passport-remember-me --save
```

## Usage

### Update your form

If you don't already have it, add a checkbox to your sign in form to allow users to opt-in for remember-me.

```html
<input name="remember-me" type="checkbox" checked>
```

The name of this field can be configured using the `keyName` during remember-me strategy initialization later on, make sure that `keyName` and the name of this field are the same.


### Import

Import the strategy and helper middlewares:

```typescript
import {
    // The strategy
    Strategy as RememberMeStrategy,
    // Helper middleware to generate tokens when
    // your sign in form is submitted wioth remember-me
    // option.
    rememberUser,
    // Helper used on logout to clear the remember-me cookie.
    signOut
} from "@jmilanes/passport-remember-me";
```

### Add an Auth Strategy

Configure at least one other authentication strategy, this is required as you need a way to authenticate users if remember-me cookies do not yet exist.
Here we are going to use `LocalStrategy`.

```typescript
// Use some other strategy to authenticate users when
// a remember-me cookie isn't available.
passport.use(
    new LocalStrategy(/* Local strategy configuration */),
    rememberUser // Helper middleware
);
```

#### Add Rememeber-Me Strategy

Configure the remember-me strategy with the required callbacks to handle user identification and token persistancy when a user visits your application.

```typescript
passport.use(new RememberMeStrategy(
    {
        // A unique salt string is the only required parameter, it is
        // used to create the tokens and makes them more secure.
        salt: "alsdhad876tasd8adgiasdghasd8"
    },
    /**
     * Get user callback, it will receive the userId, the existing token and a 
     * done callback. Use it to find the user associated with the existing token,
     * make sure to compare the given userId and token, if the user is found,
     * pass it to the done callback and null for the error.
     */
    async function(userId: string, token: string, done: VerifyCallback) {
      const { err, user } = await Database.find("remembered", { uid: userId, token: token });
      // If an error occurs during token verification, pass the error as first argument to done
      if (err) { return done(err); }
      // If no error, but no user was associated with the token, pass null as error and false as user
      if (!user) { return done(null, false); }
      // If a user was found, make sure to clear the token from your database, tokens
      // must be single use for security purpouses, a new one will be generated.
      await Database.remove("remembered", { id: userId, token: token });
      // finally, pass null as error and the user object as the second argument to the
      // done callback.
      return done(null, user);
    },
    /**
     * The saveToken callback must be used to save the newly generated token in your
     * database, which will again be used to authenticate the user the next time around.
     */
     async function(token: string, userId: string, done: IssueCallback) {
          const { err } = await Database.insert("remembered", { uid: userId, token: token });
          // Same as before, if an error ocurred, pass it to the done callback
          if (err) { return done(err); }
          // Otherwise, null as error and no arguments.
          return done();
      }
));
```

### Configure Authentication

This is basic authentication environment config, using cookie, session and passport, all 3 are necessary.

```typescript
// the same secret for both to avoid problems specified here https://www.npmjs.com/package/express-session
app.use(express.cookieParser(process.env.SOME_SECRET_STRING));
app.use(express.bodyParser());
// Initialize passport and session
app.use(express.session({ secret: process.env.SOME_SECRET_STRING }));
app.use(passport.initialize());
app.use(passport.session());
```
Your app is now ready to use passport auth strategies.


### Add Auth and Remember-me Strategies

Add the remember-me authentication, must come before your main authentication
This is so, because it will try to authenticate the income user with an existing
token, otherwise it will fallback to your other authentication methods.

Notice we don't provide a **successRedirect** to the local strategy, instead we
provide it to Remember-me strategy, this is to allow the local strategy to call next instead of 
redirecting, so **rememberUser** can be excuted after each successfull authentication.

The **successRedirect** will be called by **rememberUser** even if it fails to generate 
the token, this is because remember-me is considered a convinience method, and so should
not cause any interroptions or errors if it fails.

Errors will be logged as warnings, you can also pass your own logger to Remember-me, to keep track
and address any errors.

```typescript
// Remember-me first, with the successRedirect
app.use(passport.authenticate('remember-me', { successRedirect: '/account' }));

// ...other app routes.

// Add the sign-in route for you main authentication strategy, along with the
// helper rememberUser middleware provided by remember-me. 
app.post('/sign-in',
    passport.authenticate("local", { failureRedirect: '/sign-in', failureFlash: true }),
    // This middleware will create a token and cookie if the user was successfuly authenticated.
    rememberUser
);

// Add your sign-out route, use the provided signOut helper middleware which
// will remove the existing remember-me cookie and sign the user out, you may
// provide a callback, or it will call next to allow further logic.
app.get('/sign-out', signOut('/'));
```

### Tha's it!

Users of your application will now be able to choose remember-me during your sign in process, and not have to provide username and password the next time they come to your app.

This is a cool convenience method specially when users visit your app on a regular basis.


## Example

For a complete, working example, refer to the [login example](https://github.com/jairmilanes/passport-remember-me/tree/master/example).

you may also run the example locally using:

```shell
npm start
```

## Tests

```shell
$ npm install
$ npm run test
```

[![Build Status](https://secure.travis-ci.org/jaredhanson/passport-remember-me.png)](http://travis-ci.org/jaredhanson/passport-remember-me)


## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2023 [Jair Milanes](http://github.com/jairmilanes/)
