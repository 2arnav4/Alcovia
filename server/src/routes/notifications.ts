import { Router } from "express";
import { getNotificationLogs, recordMockNotification } from "../services/notificationService";

export const notificationsRouter = Router();

notificationsRouter.get("/", (_request, response) => {
  response.json({ notifications: getNotificationLogs() });
});

notificationsRouter.post("/mock", (request, response) => {
  const notification = recordMockNotification(request.body);
  response.status(201).json(notification);
});
