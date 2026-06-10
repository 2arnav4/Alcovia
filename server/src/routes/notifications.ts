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
  if (!isText(request.body?.sessionId) || !isText(request.body?.message)) {
    response.status(400).json({ error: "sessionId and message are required" });
    return;
  }

  const notification = recordNotificationFromSink(request.body);
  response.status(201).json(notification);
});

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
