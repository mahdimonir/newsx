import { Router } from "express";
import { toggleLike } from "../controllers/likeController.js";
import { verifyJWT } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggle").patch(toggleLike);

export default router;
