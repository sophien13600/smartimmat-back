import connection from "../config/db.config.js";
import bcrypt from "bcrypt";


const checkUser = async (email, password) => {
  // Requête SQL pour récupérer l'utilisateur par son email
  const SELECT = "SELECT * FROM users WHERE email=?";

  try {
    const resultat = await connection.query(SELECT, [email]);
    const user = resultat[0][0];
//console.log('repo', resultat);

    if (!user) {
      return null;
    }
   
    

    // Comparaison du mot de passe saisi avec le mot de passe haché en base
    const compare = await bcrypt.compare(password, user.password);

    // Vérification du résultat de la comparaison
    if (!compare) {
    
      // Mot de passe incorrect
      return null;
    }
console.log(user);

    return user;
  } catch (error) {
    console.log("Erreur lors de la vérification des identifiants :", error);
    return null;
  }
};

export default {

  checkUser,
};