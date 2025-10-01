import { Router } from "express";
import {
  createComment,
  createNestedComment,
  deleteComment,
  getComments,
  updateComment,
} from "../controllers/commentController.js";
import { verifyJWT } from "../middleware/authMiddleware.js";

const router = Router();

// Comment routes
router.route("/").post(verifyJWT, createComment);
router.route("/replies").post(verifyJWT, createNestedComment);
router
  .route("/:commentId")
  .patch(verifyJWT, updateComment)
  .delete(verifyJWT, deleteComment);
router.route("/:postId").get(getComments);

export default router;
