import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
const PgSession = connectPgSimple(session);
const prisma = new PrismaClient();


//1. Create express app instance
const app = express();

//2. Middleware to parse JSON bodies
app.use(express.json());

//3. Middleware to parse cookies
app.use(cookieParser());

// Ensure session secret is not null
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required');
}
// Connect session to DB
const sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
        tableName: 'session'
})

//4. Session middleware -> initialises a session and set cookie header with SID
app.use(session({
    store: sessionStore,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,     
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        //ms, sec, min, hour, day
    }
}));

//5. passport middleware -> attach helper functions to req
app.use(passport.initialize());

//6. passport middleware session -> on every req calls deserializeUser 
app.use(passport.session());

// Serialize user into the sesssion
passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
    done(null, user.id)
})

// Deserialize user from the session
passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user || false);
    } catch (err) {
        done(err);
    }
});

//7. Basic route to root for testing
app.get('/' , (req: express.Request, res: express.Response) => {   
    res.send('Express app is running');
});

//8. Error handling middleware for middlewares
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

export default app;




