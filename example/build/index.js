"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const markdown_it_1 = __importDefault(require("markdown-it"));
const highlight_js_1 = __importDefault(require("highlight.js"));
const fs_1 = require("fs");
const flat_file_db_1 = __importDefault(require("flat-file-db"));
const passport_remember_me_1 = require("@jmilanes/passport-remember-me");
const typescript_1 = __importDefault(require("highlight.js/lib/languages/typescript"));
highlight_js_1.default.registerLanguage("typescript", typescript_1.default);
const secret = "ajkldhakdsoajsdoiu";
if (!(0, fs_1.existsSync)("./.rm")) {
    (0, fs_1.mkdirSync)("./.rm");
}
if (!(0, fs_1.existsSync)("./.rm/token.db")) {
    (0, fs_1.writeFileSync)("./.rm/token.db", "");
}
/**
 * Fake in memory token storage, DO NOT DO THIS IN PRODUCTION
 * make sure you store tokens in a cache or prefferably database,
 * you want to make sure this tokens are available even if the
 * server get's re-started.
 */
const tokens = flat_file_db_1.default.sync("./.rm/token.db", { fsync: true });
/**
 * Fake users db, for demonstration only.
 */
const users = [
    { id: "aksjdhaslkdaslkdhj", username: 'bob', password: 'secret', email: 'bob@example.com' },
    { id: "aspioduasodiuasdds", username: 'joe', password: 'birthday', email: 'joe@example.com' }
];
function findUser(payload, done) {
    const userIdOrUsername = typeof payload === "string"
        ? payload
        : (payload === null || payload === void 0 ? void 0 : payload.id) || (payload === null || payload === void 0 ? void 0 : payload.username);
    const user = users.find(u => u.id === userIdOrUsername || u.username === userIdOrUsername);
    if (user) {
        done(null, user);
    }
    else {
        done(new Error(`User "${payload}" was not found!`));
    }
}
function getUser(userId, token, done) {
    const userToken = tokens.get(userId);
    if (!userToken || userToken !== token) {
        return done(new Error("Tokens differ for user id."));
    }
    findUser(userId, (error, user) => {
        if (!error) {
            // Make sure to clear the token if the user was found
            tokens.del(userId);
        }
        done(error, user);
    });
}
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/sign-in');
}
function ensureAccountIfAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/account');
    }
    next();
}
function saveToken(token, userId, callback) {
    tokens.put(userId, token, () => {
        return callback();
    });
}
/**
 * Passport session user serialization callback
 */
passport_1.default.serializeUser(function (user, done) {
    done(null, user.id);
});
/**
 * Passport session user deserialization callback
 */
passport_1.default.deserializeUser(function (id, done) {
    findUser(id, done);
});
/**
 * LocalStrategy configuration,
 * for detailed information visit https://www.passportjs.org/packages/passport-local/
 */
const localStrategy = new passport_local_1.Strategy(function (username, password, done) {
    process.nextTick(function () {
        findUser(username, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, { message: 'Unknown user ' + username });
            }
            if (user.password != password) {
                return done(null, false, { message: 'Invalid password' });
            }
            return done(null, user);
        });
    });
});
passport_1.default.use(localStrategy);
/**
 * Remember Me strategy configuration
 * You want to make sure you pass in a unique salt string here
 * it will be used to encode and decode the remember-me tokens.
 */
const rememberOptions = {
    salt: "uiasdhaisdhaisdh",
    successRedirect: '/account',
    logger: true,
};
const rememberMeStartegy = new passport_remember_me_1.Strategy(rememberOptions, getUser, saveToken);
passport_1.default.use(rememberMeStartegy);
/**
 * Simple Express Server
 */
const app = (0, express_1.default)();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('ejs', require('ejs-locals'));
app.use((0, cookie_parser_1.default)(secret));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    secret,
    resave: false,
    saveUninitialized: true
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(passport_1.default.authenticate(rememberMeStartegy.name));
app.get('/', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const markit = (0, markdown_it_1.default)({
            html: true,
            linkify: true,
            langPrefix: 'hljs language-',
            highlight: function (str, lang) {
                if (lang && highlight_js_1.default.getLanguage(lang)) {
                    try {
                        return highlight_js_1.default.highlight(str, { language: lang }).value;
                    }
                    catch (__) { }
                }
                return ''; // use external default escaping
            }
        });
        const readme = (0, fs_1.readFileSync)("../README.md", { encoding: "utf-8" });
        const readmeText = markit.render(readme);
        res.render('index', {
            title: "Docs",
            user: req.user,
            messages: req.session.messages,
            readme: readmeText,
            page: req.url
        });
    });
});
app.get('/index', function (req, res) {
    res.redirect('/');
});
app.get('/sign-in', ensureAccountIfAuthenticated, function (req, res) {
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
app.post('/sign-in', passport_1.default.authenticate(localStrategy.name, { failureRedirect: '/sign-in', failureFlash: true }), (0, passport_remember_me_1.rememberUser)(saveToken));
app.get('/account', ensureAuthenticated, function (req, res) {
    console.log(req.url);
    res.render('account', { title: "Account", user: req.user, page: req.url });
});
app.get('/sign-out', (0, passport_remember_me_1.signOut)('/'));
app.get('/shallow-sign-out', (req, res, next) => {
    return req.logout(() => {
        res.redirect('/');
    });
});
app.listen(3000, function () {
    console.log('Remember-Me test server listening on port 3000');
});
