import connection from "../config/db.config.js";
import bcrypt from "bcrypt";

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

/*const addUser = async (nom, prenom, email, password) =>{
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
        console.log('Utilisateur ajouté avec succès, ID:', result.insertId);

    }catch(error){
        console.error('Erreur lors de l’ajout de l’utilisateur :', error);
    }
}*/

const addUser = async (nom, prenom, email, password) => {
    const INSERT =
        "INSERT INTO users (nom, prenom, email, password) VALUES (?, ?, ?, ?)";

    try {
    console.log('password :',password)
        //  Génération du hash (await simplifie tout)
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('hash:',hash)
        // Insertion en base (await sur la requête)
        const [result] = await connection.query(INSERT, [
            nom,
            prenom,
            email,
            hash,
        ]);
        console.log('result' [result]);

        console.log("Utilisateur ajouté avec succès, ID:", result.insertId);
        return result.insertId;

    } catch (error) {
        console.error("Erreur lors de l’ajout de l’utilisateur :", error);
        throw error;
    }
};


export default {checkUser, addUser};