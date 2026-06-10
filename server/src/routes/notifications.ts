import { Router } from "express";
import { getNotificationLogs, recordNotificationFromSink } from "../services/notificationService";
import { getAutomationDeliveries } from "../services/automationService";

export const notificationsRouter = Router();

notificationsRouter.get("/", (_request, response) => {
  response.json({
    notifications: getNotificationLogs(),
    automationDeliveries: getAutomationDeliveries()
  });
});

notificationsRouter.post("/sink", (request, response) => {
  const notification = recordNotificationFromSink(request.body);
  response.status(201).json(notification);
});
