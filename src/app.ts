import "dotenv/config";
import config from "config";
import createServer from "./utils/server";
import connect from "./utils/connect";
import logger from "./utils/logger";

const app = createServer();

const port = config.get<number>("port");

app.listen(port, async () => {
  logger.info(`App is running at http://localhost:${port}`);

  await connect();
});

export default app;
