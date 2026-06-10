import { readJsonFile, writeJsonFile } from "../data/filePersistence";

interface FocusSuccessEvent {
  eventId: string;
  sessionId: string;
  studentId: "student_1";
  streak: number;
  coinsAwarded: number;
  message: string;
}

interface AutomationDelivery {
  event: FocusSuccessEvent;
  status: "pending" | "delivered" | "waiting_for_configuration" | "failed";
  attempts: number;
  lastAttemptAtIso?: string;
  error?: string;
}

const savedDeliveries = readJsonFile<AutomationDelivery[]>("automation-state.json") ?? [];
const deliveries = new Map(
  savedDeliveries.map((delivery) => [delivery.event.eventId, delivery])
);
const DEFAULT_NOTIFICATION_SINK_URL =
  "https://alcovia-a2dg.onrender.com/api/notifications/sink";
let activeFlush: Promise<void> | null = null;

function persistAutomationDeliveries(): void {
  writeJsonFile("automation-state.json", Array.from(deliveries.values()));
}

export function queueFocusSuccessAutomation(input: {
  sessionId: string;
  streak: number;
  coinsAwarded: number;
}): void {
  const eventId = `focus-success:${input.sessionId}`;
  if (deliveries.has(eventId)) {
    return;
  }

  deliveries.set(eventId, {
    event: {
      eventId,
      sessionId: input.sessionId,
      studentId: "student_1",
      streak: input.streak,
      coinsAwarded: input.coinsAwarded,
      message: `Streak now ${input.streak} days, +${input.coinsAwarded} coins.`
    },
    status: "pending",
    attempts: 0
  });
  persistAutomationDeliveries();
}

export async function flushAutomationDeliveries(): Promise<void> {
  if (!activeFlush) {
    activeFlush = performAutomationFlush().finally(() => {
      activeFlush = null;
    });
  }

  return activeFlush;
}

async function performAutomationFlush(): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const notificationSinkUrl =
    process.env.NOTIFICATION_SINK_URL ?? DEFAULT_NOTIFICATION_SINK_URL;

  for (const delivery of deliveries.values()) {
    if (delivery.status === "delivered") {
      continue;
    }

    if (!webhookUrl) {
      delivery.status = "waiting_for_configuration";
      delivery.error = "N8N_WEBHOOK_URL is not configured";
      persistAutomationDeliveries();
      continue;
    }

    delivery.attempts += 1;
    delivery.lastAttemptAtIso = new Date().toISOString();

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...delivery.event,
          notificationSinkUrl
        })
      });

      if (!response.ok) {
        throw new Error(`n8n webhook returned ${response.status}`);
      }

      delivery.status = "delivered";
      delivery.error = undefined;
      persistAutomationDeliveries();
    } catch (error) {
      delivery.status = "failed";
      delivery.error = error instanceof Error ? error.message : "Unknown automation error";
      persistAutomationDeliveries();
    }
  }
}

export function getAutomationDeliveries(): AutomationDelivery[] {
  return Array.from(deliveries.values());
}
