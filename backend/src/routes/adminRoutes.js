import { Router } from "express";
import {
  getSuspendedComments,
  getSuspendedPosts,
  getSuspendedUsers,
  toggleCommentSuspension,
  togglePostSuspension,
  toggleUserSuspension,
} from "../controllers/adminController.js";
import { authorized, verifyJWT } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyJWT);
router.use(authorized(["admin"]));

// User routes
router.route("/suspend/user/:userName").patch(toggleUserSuspension);
router.route("/suspended/users").get(getSuspendedUsers);

// Post routes
router.route("/suspend/post/:postId").patch(togglePostSuspension);
router.route("/suspended/posts").get(getSuspendedPosts);

// Comment routes
router.route("/suspend/comment/:commentId").patch(toggleCommentSuspension);
router.route("/suspended/comments").get(getSuspendedComments);

export default router;
