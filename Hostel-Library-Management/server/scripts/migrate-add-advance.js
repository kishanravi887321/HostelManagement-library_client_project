#!/usr/bin/env node
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Library from "../models/Library.js";
import Student from "../models/Student.js";

dotenv.config();

const run = async () => {
  try {
    await connectDB();

    console.log("Setting missing advanceAmount to 0 for Student and Library collections...");

    await Student.updateMany({ advanceAmount: { $exists: false } }, { $set: { advanceAmount: 0 } });
    await Library.updateMany({ advanceAmount: { $exists: false } }, { $set: { advanceAmount: 0 } });

    console.log("Migration complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
