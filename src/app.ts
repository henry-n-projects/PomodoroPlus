import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { configureSession } from "./config/session.js";
import { configurePassport } from "./config/passport.js";
import routes from "./routes/index.js";

const PgSession = connectPgSimple(session);

//1. Create express app instance
const app = express();

//2. Middleware to parse JSON bodies
app.use(express.json());

//3. Middleware to parse cookies
app.use(cookieParser());

//4. Session middleware -> initialises a session and set cookie header with SID
app.use(configureSession());

//5. Initialize passport
configurePassport();
//6. passport middleware -> attach helper functions to req
app.use(passport.initialize());
//7. passport middleware session -> on every req calls deserializeUser
app.use(passport.session());

//8. Basic route to root for testing
app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Express app is running");
});

// mount all routes
app.use("/api", routes);

//9. Error handling middleware for middlewares
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  }
);

export default app;
