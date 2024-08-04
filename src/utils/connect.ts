import mongoose from "mongoose";
import config from "config";

async function connect() {
  const dbUri = config.get<string>("dbUri");

  return mongoose
    .connect(dbUri)
    .then(() => {
      console.log("Connected to DB");
    })
    .catch((err) => {
      console.error("Failed to connect to DB");
      process.exit(1);
    });
}

export default connect;
