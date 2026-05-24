import app from "../app.js";
import connectDB from "../config/db.js";

const handler = async (req, res) => {
  await connectDB();
  return app(req, res);
};

export default handler;
