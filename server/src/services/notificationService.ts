import { notificationLogs, persistServerData } from "../data/serverState";
import { NotificationLog } from "../types";
import { createServerId } from "../utils/ids";

export function getNotificationLogs(): NotificationLog[] {
  return notificationLogs;
}

export function recordNotificationFromSink(payload: {
  sessionId: string;
  message: string;
  id?: string;
  createdAtIso?: string;
}) {
  const existingNotification = notificationLogs.find(
    (notification) => notification.sessionId === payload.sessionId
  );

  if (existingNotification) {
    return existingNotification;
  }

  const notification: NotificationLog = {
    id: payload.id ?? createServerId("notification"),
    sessionId: payload.sessionId,
    message: payload.message ?? "Notification received.",
    createdAtIso: payload.createdAtIso ?? new Date().toISOString()
  };

  notificationLogs.unshift(notification);
  persistServerData();
  return notification;
}
