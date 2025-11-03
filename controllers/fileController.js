import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let uploadedFiles = [];

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

// Compression d'image
const compressFile = async (req, res) => {
  try {
    const { id } = req.params;

    // Trouver le fichier dans la liste
    const file = uploadedFiles.find((f) => f.id === parseInt(id));
    if (!file) {
      return res.status(404).json({ message: "Fichier non trouvé" });
    }

    // Vérifier si c'est une image
    if (!file.mimetype.startsWith("image/")) {
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

export { uploadFile, downloadFile, getAllFiles, compressFile };
