import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

const session = require('express-session');
const PgFactory= require('connect-pg-simple')
const PgSession = PgFactory(session);

// load .env 
dotenv.config();

//1. Create express app instance
const app = express();

//2. Middleware to parse JSON bodies
app.use(express.json);

//3. Middleware to parse cookes
app.use(cookieParser());

//4. Session middleware (Postgres)
app.use(session({
    store: new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET, // DB URL
    resave: false,
    saveUninitialized: false,     
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
}));

//5. Basic route to root for testing
app.get('/' , (req, res) => {   
    res.send('Express app is running');
});

//6. Error handling middleware 
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

//6. Export app
export default app;




