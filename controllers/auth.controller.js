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
    res.status(401).json({error: 'Login failed'});}
}
catch
    (error)
    {
        res.status(500).json({error: 'Login failed'});
    }
}


const register = async (req,res,next) => {
    const user = await AuthRepository.addUser(
        req.body.nom,
        req.body.prenom,
        req.body.email,
        req.body.password
    );
}


export default { login, register};
