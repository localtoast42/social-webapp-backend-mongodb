import 'dotenv/config';
import config from 'config';
import createServer from './utils/server.js';
import connect from './utils/connect.js';
import logger from './utils/logger.js';

const app = createServer();

const port = config.get<number>('port');

app.listen(port, async () => {
  logger.info(`App is running at http://localhost:${port}`);

  await connect();
});

export default app;
