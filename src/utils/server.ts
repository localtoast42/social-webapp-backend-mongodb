import express from "express";
import config from "config";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import routes from "../routes";
import deserializeUser from "../middleware/deserializeUser";

function createServer() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  const corsOptions = {
    credentials: true,
    origin: config.get<string>("frontendUrl"),
  };

  app.use(cors(corsOptions));
  app.use(compression());

  if (config.get<boolean>("logRequests")) {
    app.use(morgan(config.get<string>("logFormat")));
  }

  app.use(deserializeUser);

  routes(app);

  return app;
}

export default createServer;
