import express from "express";
import authenticateToken from "../middleware/jwt.middleware.js";

const router = express.Router();

router.get("/api/profile", authenticateToken, (req, res) => {
    res.send("hello");
});

export default router;