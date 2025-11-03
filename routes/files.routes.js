import express from "express";
import multer from "multer";
import {
  uploadFile,
  downloadFile,
  getAllFiles,
  compressFile,
} from "../controllers/fileController.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// Upload
router.post("/api/files/upload", upload.single("file"), uploadFile);

router.post("/api/files/compress/:id", compressFile);
//router.post("/api/files/convert/:id",convertFile)

// Liste des fichiers
router.get("/api/files", getAllFiles);

// Téléchargement
router.get("api/files/download/:filename", downloadFile);

export default router;
