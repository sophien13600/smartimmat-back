import fs from 'fs';
import path from 'path';


let uploadedFiles = [];

// Upload du fichier
const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier n'a été envoyé" });
  }

  // On enregistre les infos du fichier en mémoire (pour historique futur)
  const fileData = {
    id: uploadedFiles.length + 1,
    filename: req.file.filename,
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

export {uploadFile, downloadFile, getAllFiles}