import AuthRepository from "../repositories/auth.repository.js";

const login = async (req, res, next) => {
  // Vérification des identifiants via le repository
  const user = await AuthRepository.checkUser(
    req.body.email,
    req.body.password
  );

   console.log("Données de connexion reçues :", req.body);

  if (user) {
    console.log("Connexion :ok");

  } else {
    // Si les identifiants sont incorrects
    res.send("Identifiants incorrects - Connexion échouée");
  }
};

export default{ login };