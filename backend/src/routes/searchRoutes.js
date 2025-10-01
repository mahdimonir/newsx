import { Router } from "express";
import { searchPosts, searchUsers } from "../controllers/searchController.js";

const router = Router();

router.route("/users").get(searchUsers);
router.route("/posts").get(searchPosts);

export default router;
