import { Router } from "express";
import {
  createPost,
  deleteImage,
  deletePost,
  getMyPosts,
  getPendingPosts,
  getPost,
  getPosts,
  getSuspendedPosts,
  updatePost,
  uploadImage,
} from "../controllers/postController.js";
import { verifyJWT } from "../middleware/authMiddleware.js";

const router = Router();

// Post routes
router
  .route("/")
  .get(getPosts)
  .get(verifyJWT, getSuspendedPosts)
  .post(verifyJWT, createPost);
router.route("/my").get(verifyJWT, getMyPosts);
router.route("/pending").get(verifyJWT, getPendingPosts);
router
  .route("/image")
  .post(verifyJWT, uploadImage)
  .delete(verifyJWT, deleteImage);
router
  .route("/:id")
  .get(getPost)
  .patch(verifyJWT, updatePost)
  .delete(verifyJWT, deletePost);

export default router;
