import AuthRepository from "../repositories/auth.repository.js";

const login = async (req, res, next) => {
  // Vérification des identifiants via le repository
  const user = await AuthRepository.checkUser(
    req.body.email,
    req.body.password
  );

  //console.log("Données de connexion reçues :", req.body);

  if (user) {
    //console.log(user);

      res.status(200).json({

      user: {
        id: user.id,
        name: user.nom,
        email: user.email,
      },
    });
  } else {
    res.status(500).json({
      status: "error",
    });
  }
};

const register = async (req,res,next) => {
    const user = await AuthRepository.addUser(
        req.body.nom,
        req.body.prenom,
        req.body.email,
        req.body.password
    );
}


export default { login, register};
