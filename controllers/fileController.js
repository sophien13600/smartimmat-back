import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import db from "../config/db.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let uploadedFiles = [];

// Helpers
const getUploadsPath = (...parts) => path.join(__dirname, "../uploads", ...parts);
const normalizeFormat = (fmt) => (fmt || "").toString().trim().toLowerCase();

// History helpers (DB persistence with graceful fallback)
const addHistory = async ({ action, resultFilename, sourceFilename = null, userId = null }) => {
  try {
    await db.execute(
      `CREATE TABLE IF NOT EXISTS processed_history (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action ENUM('COMPRESS','CONVERT') NOT NULL,
        result_filename VARCHAR(255) NOT NULL,
        source_filename VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`);
    await db.execute(
      "INSERT INTO processed_history (user_id, action, result_filename, source_filename) VALUES (?,?,?,?)",
      [userId, action, resultFilename, sourceFilename]
    );
  } catch (e) {
    console.warn("[history] DB add failed, continuing without persistence:", e?.message);
  }
};

const getHistoryFromDb = async () => {
  try {
    const [rows] = await db.execute(
      "SELECT id, user_id as userId, action, result_filename as resultFilename, source_filename as sourceFilename, created_at as createdAt FROM processed_history ORDER BY id DESC"
    );
    return rows;
  } catch (e) {
    console.warn("[history] DB read failed:", e?.message);
    return [];
  }
};

const deleteHistoryFromDb = async (id) => {
  try {
    const [rows] = await db.execute("SELECT result_filename as resultFilename FROM processed_history WHERE id=?", [id]);
    const resultFilename = rows?.[0]?.resultFilename || null;
    await db.execute("DELETE FROM processed_history WHERE id=?", [id]);
    return resultFilename;
  } catch (e) {
    console.warn("[history] DB delete failed:", e?.message);
    return null;
  }
};

// Upload du fichier
const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier n'a été envoyé" });
  }

  // Récupération de l'extension du fichier original
  const fileExtension = path.extname(req.file.originalname);

  // Renommer le fichier pour ajouter l'extension
  const newFilename = req.file.filename + fileExtension;
  const oldPath = path.join(__dirname, "../uploads", req.file.filename);
  const newPath = path.join(__dirname, "../uploads", newFilename);

  fs.renameSync(oldPath, newPath);

  // On enregistre les infos du fichier en mémoire (pour historique futur)
  const fileData = {
    id: uploadedFiles.length + 1,
    filename: newFilename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    uploadDate: new Date(),
  };
  uploadedFiles.push(fileData);


  res.json({
    message: "Fichier uploadé avec succès",
    file: fileData,
  });
};
// Téléchargement du fichier par nom
const downloadFile = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "../uploads", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Fichier introuvable" });
  }

  res.download(filePath);
};

// Récupération de la liste des fichiers uploadés
const getAllFiles = (req, res) => {
  res.json(uploadedFiles);
};

// Compression d'image par ID (réponse JSON)
const compressFile = async (req, res) => {
  try {
    const { id } = req.params;

    // Trouver le fichier dans la liste
    const file = uploadedFiles.find((f) => f.id === parseInt(id));
    if (!file) {
      return res.status(404).json({ message: "Fichier non trouvé" });
    }

    // Vérifier si c'est une image
    if (!file.mimetype?.startsWith("image/")) {
      return res
        .status(400)
        .json({ message: "Le fichier n'est pas une image" });
    }

    const inputPath = path.join(__dirname, "../uploads", file.filename);
    // S'assurer que le fichier compressé a l'extension .jpg
    const outputFilename = `compressed_${path.parse(file.filename).name}.jpg`;
    const outputPath = path.join(__dirname, "../uploads", outputFilename);

    // Compresser l'image avec Sharp
    await sharp(inputPath)
      .jpeg({ quality: 60 }) // Compression JPEG avec qualité 60%
      .resize(800, 800, {
        // Redimensionner si nécessaire
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFile(outputPath);

    // Ajouter le fichier compressé à la liste
    const compressedFileData = {
      id: uploadedFiles.length + 1,
      filename: outputFilename,
      originalName: `compressed_${file.originalName}`,
      mimetype: "image/jpeg",
      size: fs.statSync(outputPath).size,
      uploadDate: new Date(),
      compressedFrom: file.id,
    };

    uploadedFiles.push(compressedFileData);

    // Add to history (DB)
    await addHistory({ action: 'COMPRESS', resultFilename: outputFilename, sourceFilename: file.filename, userId: req.user?.id || null });

    res.json({
      message: "Image compressée avec succès",
      file: compressedFileData,
    });
  } catch (error) {
    console.error("Erreur lors de la compression:", error);
    res.status(500).json({
      message: "Erreur lors de la compression de l'image",
      error: error.message,
    });
  }
};

// Conversion par nom de fichier (réponse = téléchargement du fichier converti)
const convertFileByFilename = async (req, res) => {
  try {
    const { filename } = req.params;
    const { format: rawFormat, compress } = req.query;
    const format = normalizeFormat(rawFormat);

    const allowed = ["png", "webp", "avif", "jpg", "jpeg"];
    if (!allowed.includes(format)) {
      return res.status(400).json({
        message: "Format non supporté. Utilisez png, webp, avif, jpg",
      });
    }

    const file = uploadedFiles.find((f) => f.filename === filename);
    if (!file) {
      return res.status(404).json({ message: "Fichier non trouvé" });
    }
    if (!file.mimetype?.startsWith("image/")) {
      return res
        .status(400)
        .json({ message: "La conversion est supportée uniquement pour les images" });
    }

    const inputPath = getUploadsPath(file.filename);
    const baseName = path.parse(file.filename).name;
    const targetExt = format === "jpeg" ? "jpg" : format;
    const outputFilename = `${baseName}.${targetExt}`;
    const outputPath = getUploadsPath(outputFilename);

    // Build sharp pipeline
    let pipeline = sharp(inputPath).rotate();

    // Optional resize/compress if compress=true
    const doCompress = compress === "true" || compress === "1";

    if (format === "png") {
      pipeline = pipeline.png({ compressionLevel: doCompress ? 9 : 6 });
    } else if (format === "webp") {
      pipeline = pipeline.webp({ quality: doCompress ? 60 : 80 });
    } else if (format === "avif") {
      pipeline = pipeline.avif({ quality: doCompress ? 50 : 75 });
    } else if (format === "jpg" || format === "jpeg") {
      pipeline = pipeline.jpeg({ quality: doCompress ? 65 : 80 });
    }

    await pipeline.toFile(outputPath);

    // Enregistrer dans l'historique
    const convertedData = {
      id: uploadedFiles.length + 1,
      filename: outputFilename,
      originalName: outputFilename,
      mimetype:
        format === "png"
          ? "image/png"
          : format === "webp"
          ? "image/webp"
          : format === "avif"
          ? "image/avif"
          : "image/jpeg",
      size: fs.existsSync(outputPath) ? fs.statSync(outputPath).size : undefined,
      uploadDate: new Date(),
      convertedFrom: file.id,
    };
    uploadedFiles.push(convertedData);

    // Add to history (DB)
    await addHistory({ action: 'CONVERT', resultFilename: outputFilename, sourceFilename: file.filename, userId: req.user?.id || null });

    const contentType = convertedData.mimetype;
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(outputFilename)}`
    );

    const stream = fs.createReadStream(outputPath);
    stream.on("error", (err) => {
      console.error("Erreur lors de l'envoi du fichier converti:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Erreur lors de l'envoi du fichier converti" });
      }
    });
    stream.pipe(res);
  } catch (error) {
    console.error("Erreur de conversion:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Erreur lors de la conversion", error: error.message });
    }
  }
};

// Compression par nom de fichier (réponse = téléchargement du fichier)
const compressFileByFilename = async (req, res) => {
  try {
    const { filename } = req.params;

    // Trouver le fichier dans la liste (par nom exact)
    const file = uploadedFiles.find((f) => f.filename === filename);
    if (!file) {
      return res.status(404).json({ message: "Fichier non trouvé" });
    }

    if (!file.mimetype?.startsWith("image/")) {
      return res.status(400).json({ message: "Le fichier n'est pas une image" });
    }

    const inputPath = path.join(__dirname, "../uploads", file.filename);
    const outputFilename = `compressed_${path.parse(file.filename).name}.jpg`;
    const outputPath = path.join(__dirname, "../uploads", outputFilename);

    // Éviter de recompresser si déjà présent
    if (!fs.existsSync(outputPath)) {
      await sharp(inputPath)
        .jpeg({ quality: 60 })
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .toFile(outputPath);
    }

    // Enregistrer dans l'historique avant l'envoi
    const compressedFileData = {
      id: uploadedFiles.length + 1,
      filename: outputFilename,
      originalName: `compressed_${file.originalName}`,
      mimetype: "image/jpeg",
      size: fs.statSync(outputPath).size,
      uploadDate: new Date(),
      compressedFrom: file.id,
    };
    uploadedFiles.push(compressedFileData);

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(outputFilename)}`
    );

    const stream = fs.createReadStream(outputPath);
    stream.on("error", (err) => {
      console.error("Erreur lors de l'envoi du fichier:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Erreur lors de l'envoi du fichier" });
      }
    });
    stream.pipe(res);
  } catch (error) {
    console.error("Erreur lors de la compression:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Erreur lors de la compression de l'image",
        error: error.message,
      });
    }
  }
};




// History endpoints
const getHistory = async (req, res) => {
  try {
    const rows = await getHistoryFromDb();
    // Enrich with size and date from disk if needed
    const enriched = rows.map((r) => {
      const p = getUploadsPath(r.resultFilename);
      let size = null;
      let exists = false;
      try {
        const st = fs.statSync(p);
        size = st.size;
        exists = true;
      } catch (_) {}
      return { ...r, size, exists };
    });
    res.json(enriched);
  } catch (e) {
    console.error("Erreur historique:", e);
    res.status(500).json({ message: "Erreur lors de la récupération de l'historique" });
  }
};

const deleteHistoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const resultFilename = await deleteHistoryFromDb(id);

    if (!resultFilename) {
      return res.status(404).json({ message: "Élément d'historique introuvable" });
    }

    // Delete from disk
    const filePath = getUploadsPath(resultFilename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.warn("[history] unlink failed:", e?.message); }
    }

    // Remove from in-memory list
    uploadedFiles = uploadedFiles.filter((f) => f.filename !== resultFilename);

    res.json({ message: "Historique supprimé et fichier supprimé" });
  } catch (e) {
    console.error("Erreur suppression historique:", e);
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
};

export { uploadFile, downloadFile, getAllFiles, compressFile, compressFileByFilename, convertFileByFilename, getHistory, deleteHistoryItem };
