import connection from "../config/db.config.js";
import bcrypt, {hash} from "bcrypt";

const saltRounds = 10;

const checkUser = async (email, password) => {
  // Requête SQL pour récupérer l'utilisateur par son email
  const SELECT = "SELECT * FROM users WHERE email=?";

  try {
    const resultat = await connection.query(SELECT, [email]);
    const user = resultat[0][0];
console.log('repo', resultat);

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

const addUser = async (nom, prenom, email, password) =>{
    const INSERT = "INSERT INTO users (nom, prenom, email, password) VALUES (?, ?, ?, ?)";
    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            // Store hash in your password DB.
            console.log(hash);
            return hash;
        });
    });
    try {
        const user = await connection.query(INSERT,[nom, prenom, email, hash] );


    }
}

export default {checkUser, addUser};