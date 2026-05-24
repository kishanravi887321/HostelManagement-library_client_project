import express from "express";
import multer from "multer";
import {
  addLibraryStudent,
  getLibraryStudents,
  updateLibraryStudent,
  deleteLibraryStudent,
} from "./library.controller.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/add", upload.single("identityProof"), addLibraryStudent);
router.get("/", getLibraryStudents);
router.put("/:id", updateLibraryStudent);
router.delete("/:id", deleteLibraryStudent);

export default router;
