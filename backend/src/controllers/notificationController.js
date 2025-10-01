import { Notification } from "../models/notificationModel.js";
import { ForbiddenError, NotFoundError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { throwIf } from "../utils/throwIf.js";

// Get paginated notifications for the authenticated user
Notification.createIndexes({ user: 1, createdAt: -1 });

const getNotifications = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const totalDocs = await Notification.countDocuments({ user: req.user._id });
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const hasNextPage = page * limit < totalDocs;
    console.log({
      page,
      skip,
      limit,
      totalDocs,
      hasNextPage,
      notifications: notifications.length,
    });
    res.status(200).json({
      data: {
        notifications,
        totalDocs,
        hasNextPage,
        currentPage: page,
        totalPages: Math.ceil(totalDocs / limit),
      },
      success: true,
      message: "Notifications retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Mark a notification as read
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  throwIf(!req.userId, new ForbiddenError("Unauthorized"));

  const notification = await Notification.findById(id).populate("user");
  throwIf(!notification, new NotFoundError("Notification not found"));
  throwIf(
    notification.user._id.toString() !== req.userId.toString(),
    new ForbiddenError("Unauthorized")
  );

  notification.isRead = true;
  await notification.save();

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

// Mark all notifications as read for the authenticated user
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  throwIf(!req.userId, new ForbiddenError("Unauthorized"));

  await Notification.updateMany(
    { user: req.userId, isRead: false },
    { isRead: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "All notifications marked as read"));
});

// Delete a notification
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("Deleteing request:", req);
  throwIf(!req.userId, new ForbiddenError("Unauthorized"));

  const notification = await Notification.findById(id).populate("user");
  throwIf(!notification, new NotFoundError("Notification not found"));
  throwIf(
    notification.user._id.toString() !== req.userId.toString(),
    new ForbiddenError("Unauthorized")
  );

  await Notification.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Notification deleted successfully"));
});

// Delete all notifications for the authenticated user
const deleteAllNotifications = asyncHandler(async (req, res) => {
  throwIf(!req.userId, new ForbiddenError("Unauthorized"));

  await Notification.deleteMany({ user: req.userId });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "All notifications deleted successfully"));
});

export {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
};
