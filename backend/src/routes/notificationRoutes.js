import { Router } from "express";
import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notificationController.js";
import { verifyJWT } from "../middleware/authMiddleware.js";

const router = Router();

router
  .route("/")
  .get(verifyJWT, getNotifications)
  .patch(verifyJWT, markAllNotificationsAsRead)
  .delete(verifyJWT, deleteAllNotifications);
router.route("/:id/read").patch(verifyJWT, markNotificationAsRead);
router.route("/:id").delete(verifyJWT, deleteNotification);

export default router;
