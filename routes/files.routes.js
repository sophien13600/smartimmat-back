import express from "express";
import multer from "multer";
import {
  uploadFile,
  downloadFile,
  getAllFiles,
  compressFile,
  compressFileByFilename,
  convertFileByFilename,
  getHistory,
  deleteHistoryItem,
} from "../controllers/fileController.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// Upload
router.post("/api/files/upload", upload.single("file"), uploadFile);

// Compression par ID (JSON)
router.post("/api/files/compress/:id", compressFile);
// Compression par nom de fichier (téléchargement direct)
router.get("/api/files/compress/:filename", compressFileByFilename);

// Conversion par nom de fichier (téléchargement direct)
router.get("/api/files/convert/:filename", convertFileByFilename);

// Liste des fichiers
router.get("/api/files", getAllFiles);

// Historique des traitements
router.get("/api/files/history", getHistory);
router.delete("/api/files/history/:id", deleteHistoryItem);

// Téléchargement
router.get("/api/files/download/:filename", downloadFile);

export default router;
