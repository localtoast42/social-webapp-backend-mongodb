import 'dotenv/config';
import createError from 'http-errors';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import mongoose from 'mongoose';
import passport from 'passport';
import passportConfig from './config/passport.js';

import indexRouter from './routes/index.js';

const app = express();

const corsOptions = {
  credentials: true,
  origin: process.env.FRONTEND_URL
};

app.use(cors(corsOptions));

mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB);

passportConfig(passport);
app.use(passport.initialize());

// view engine setup
const viewsURL = new URL('views', import.meta.url);
app.set('views', viewsURL.toString());
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const staticURL = new URL('public', import.meta.url);
app.use(express.static(staticURL.toString()));

app.use('/api/v1', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
