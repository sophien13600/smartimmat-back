import express from "express";
import AuthController from "../controllers/auth.controller.js";

const router = express.Router();
router.post("/api/auth/login", AuthController.login);
router.get('/api/auth/login', (req, res) => {
  res.send('hello world')
})


export default router;