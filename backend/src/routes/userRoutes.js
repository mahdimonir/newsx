// routes/auth.routes.js
import { Router } from "express";
import { getSuspendedComments } from "../controllers/commentController.js";
import { getSuspendedPosts } from "../controllers/postController.js";
import {
  followUser,
  getAllUser,
  getSingleUser,
  getUserProfile,
} from "../controllers/userController.js";
import { verifyJWT } from "../middleware/authMiddleware.js";

const router = Router();

router.route("/").get(getAllUser);
router.route("/profile").get(verifyJWT, getUserProfile);
router.route("/:userName").get(getSingleUser);
router.route("/follow").post(verifyJWT, followUser);

// Suspended Posts and Comments
router.route("/suspended/posts").get(verifyJWT, getSuspendedPosts);
router.route("/suspended/comments").get(verifyJWT, getSuspendedComments);
export default router;
