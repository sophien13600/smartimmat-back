import AuthRepository from "../repositories/auth.repository.js";

const login = async (req, res, next) => {
  // Vérification des identifiants via le repository
  const user = await AuthRepository.checkUser(
    req.body.email,
    req.body.password
  );

   //console.log("Données de connexion reçues :", req.body);

  if (user) {
    res.status(200).json({
            status: "success",});
  } else {
    res.status(500).json({
            status: "error",});
  }
};

export default{ login };