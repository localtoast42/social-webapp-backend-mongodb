import 'dotenv/config';
import config from 'config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import connect from './utils/connect.js';
import logger from './utils/logger.js';
import routes from './routes.js';
import deserializeUser from './middleware/deserializeUser.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const corsOptions = {
  credentials: true,
  origin: config.get<string>('frontendUrl'),
};

app.use(cors(corsOptions));
app.use(compression());

app.use(deserializeUser);

const port = config.get<number>('port');

app.listen(port, async () => {
  logger.info(`App is running at http://localhost:${port}`);

  await connect();

  routes(app);
});

export default app;
