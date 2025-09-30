//import auth from 'basic-auth'
import cors from "cors";
import express from "express";
import "dotenv/config";
import path from "path";
import authRoutes from "./routes/auth.routes.js";

const app = express()


app.use(express.urlencoded());
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173"],
          // ["http://localhost:5174"]
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
  })
);

// const basicAuth = (req, res, next) => {
  //const unknownUser = req.headers['authorization']
  // const unknownUser = auth(req)
    // console.log('ici',req.body);
    // const {email, pass} = unknownUser
    // if (req.body.email!= user.email || req.body.password!= user.password) {
    //    return res.sendStatus(401)
    // }
  
    

 

app.use("/", authRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use(express.static(path.join(process.cwd(), "public")));

app.all("/*splat", (req, res) => {
  res.status(404).end("Page introuvable");
});
const PORT = process.env.PORT || 5555;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur : http://localhost:${PORT}`);
})
