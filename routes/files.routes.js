import express from "express";
import multer from "multer";
import { uploadFile, downloadFile, getAllFiles } from "../controllers/fileController.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// Upload
router.post("/api/files/upload", upload.single("file"), uploadFile);

// Liste des fichiers
router.get("/api/files", getAllFiles);

// Téléchargement
router.get("api/files/download/:filename", downloadFile);



export default router;
