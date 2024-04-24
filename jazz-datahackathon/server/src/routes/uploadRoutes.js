import express from "express";
import multer from "multer";
import { uploadFile, searchFiles } from "../controllers/uploadController.js";

const router = express.Router();

// Configure Multer
const upload = multer({ dest: 'uploads/' });

// POST endpoint for file upload
router.post('/upload', upload.single('file'), uploadFile);

// GET endpoint for file search
router.get('/search', searchFiles);

export { router as Router };
