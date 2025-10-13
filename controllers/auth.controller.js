import AuthRepository from "../repositories/auth.repository.js";
import jwt from "jsonwebtoken";
import 'dotenv/config';

const secretKey = process.env.JWT_SECRET;

const login = async (req, res, next) => {
    // Vérification des identifiants via le repository
    const user = await AuthRepository.checkUser(
        req.body.email,
        req.body.password
    );

    console.log("Données de connexion reçues :", req.body);
try {
    if (user) {
        console.log(user);
        const token = jwt
            .sign({userId: user.id}, secretKey, {
                expiresIn: '1h',
            })
        res.status(200).json({token})
    }else{
    res.status(401).json({error: '401 Login failed'});}
}
catch
    (error)
    {
        res.status(500).json({error: '500 Login failed'});
    }
}


const register = async (req,res,next) => {
    if(req.body){
        console.log(req.body);

        //destructuration de l'objet req.body
        const { nom, prenom, email, password } = req.body;

        const user = await AuthRepository.addUser(nom, prenom, email, password);
        if(user) {
            return res.status(201).json({
                success: true,
                message: "Utilisateur crée avec succès",

            })
        } else {
          return res.status(400).json({
              success: false,
              message: "Cet email existe déjà"
          })
        }
    }
}


export default { login, register};
