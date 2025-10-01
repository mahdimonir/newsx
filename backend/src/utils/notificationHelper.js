import { Notification } from "../models/notificationModel.js";

const createNotification = async ({ userId, message, type, link }) => {
  try {
    const notification = new Notification({
      user: userId,
      message,
      type,
      link,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

export { createNotification };
