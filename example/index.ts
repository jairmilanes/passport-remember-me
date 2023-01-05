import express, { NextFunction, Request, Response } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import cookieParser from "cookie-parser";
import session from "express-session";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js"
import { readFileSync, mkdirSync, existsSync, writeFileSync } from "fs";
import open from "flat-file-db";
import {
  Strategy as RemembermeStrategy,
  RefreshCallback,
  RememberMeOptions,
  User,
  rememberUser,
  signOut
} from "@jmilanes/passport-remember-me";
import hljsTypescript from "highlight.js/lib/languages/typescript"

hljs.registerLanguage("typescript", hljsTypescript);

const secret = "ajkldhakdsoajsdoiu"

if (!existsSync("./.rm")) {
  mkdirSync("./.rm");
}

if (!existsSync("./.rm/token.db")) {
  writeFileSync("./.rm/token.db", "");
}

/**
 * Fake in memory token storage, DO NOT DO THIS IN PRODUCTION
 * make sure you store tokens in a cache or prefferably database,
 * you want to make sure this tokens are available even if the
 * server get's re-started.
 */
const tokens = open.sync("./.rm/token.db", { fsync: true });

type UserPayload = string|User

/**
 * Fake users db, for demonstration only.
 */
const users = [
    { id: "aksjdhaslkdaslkdhj", username: 'bob', password: 'secret', email: 'bob@example.com' }
  , { id: "aspioduasodiuasdds", username: 'joe', password: 'birthday', email: 'joe@example.com' }
];

function findUser(payload: UserPayload, done: RefreshCallback) {
  const userIdOrUsername = typeof payload === "string"
      ? payload
      : payload?.id || payload?.username;

  const user = users.find(
      u => u.id === userIdOrUsername || u.username === userIdOrUsername
  );

  if (user) {
    done(null, user);
  } else {
    done(new Error(`User "${payload}" was not found!`));
  }
}

function getUser(userId: string, token: string, done: RefreshCallback) {
  const userToken = tokens.get(userId);

  if (!userToken || userToken !== token) {
    return done(new Error("Tokens differ for user id."))
  }

  findUser(userId, (error, user) => {
    if (!error) {
      // Make sure to clear the token if the user was found
      tokens.del(userId);
    }

    done(error, user);
  });
}

function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) { return next(); }

  res.redirect('/sign-in')
}

function ensureAccountIfAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return res.redirect('/account')
  }

  next();
}

function saveToken(token: string, userId: string, callback: () => void) {
  tokens.put(userId, token, () => {
    return callback();
  });
}

/**
 * Passport session user serialization callback
 */
passport.serializeUser(function(user: any, done) {
  done(null, user.id);
});

/**
 * Passport session user deserialization callback
 */
passport.deserializeUser(function(id: string, done) {
  findUser(id, done);
});


/**
 * LocalStrategy configuration,
 * for detailed information visit https://www.passportjs.org/packages/passport-local/
 */
const localStrategy = new LocalStrategy(
    function(username, password, done) {
      process.nextTick(function () {
        findUser(username, function(err, user) {
          if (err) { return done(err); }
          if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
          if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
          return done(null, user);
        })
      });
    }
);

passport.use(localStrategy);

/**
 * Remember Me strategy configuration
 * You want to make sure you pass in a unique salt string here
 * it will be used to encode and decode the remember-me tokens.
 */
const rememberOptions: RememberMeOptions = {
  salt: "uiasdhaisdhaisdh",
  successRedirect: '/account',
  logger: true,
};

const rememberMeStartegy = new RemembermeStrategy(
    rememberOptions, getUser, saveToken
);

passport.use(rememberMeStartegy);

/**
 * Simple Express Server
 */
const app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('ejs', require('ejs-locals'));
app.use(cookieParser(secret));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json());
app.use(session({
  secret,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate(rememberMeStartegy.name));

app.get('/', async function(req, res){
  const markit = MarkdownIt({
    html: true,
    linkify: true,
    langPrefix: 'hljs language-',
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch (__) {}
      }

      return ''; // use external default escaping
    }
  });

  const readme = readFileSync("../README.md", { encoding: "utf-8" })

  const readmeText = markit.render(readme);

  res.render('index', {
    title: "Docs",
    user: req.user,
    messages: req.session.messages,
    readme: readmeText,
    page: req.url
  });
});

app.get('/index', function(req, res) {
  res.redirect('/');
});

app.get('/sign-in', ensureAccountIfAuthenticated, function(req, res) {
  res.render('sign-in', { title: "Sign-In", user: req.user, messages: [], page: req.url });
});

/**
 * Sign in handler
 *
 * Uses passport-local to authenticate users, make sure to not pass
 * a successRedirect here to allow the remember middleware to run after
 * successfull authentication.
 *
 * You may provide the success redirect in the RememberMeStrategy configuration
 * who will than redirect users after generating a remember me token.
 */
app.post('/sign-in',
  passport.authenticate(localStrategy.name, { failureRedirect: '/sign-in', failureFlash: true }),
  rememberUser(saveToken)
);

app.get('/account', ensureAuthenticated, function(req, res) {
  console.log(req.url)
  res.render('account', { title: "Account", user: req.user, page: req.url });
});

app.get('/sign-out', signOut('/'));

app.get('/shallow-sign-out', (req, res, next) => {
  return req.logout(() => {
    res.redirect('/');
  });
});

app.listen(3000, function() {
  console.log('Remember-Me test server listening on port 3000');
});
