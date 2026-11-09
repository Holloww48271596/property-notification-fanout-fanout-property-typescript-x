import { z } from "zod";
import { infrai } from "./infrai-client.js";

export const notificationRequest = z.object({
  propertyId: z.string().min(1),
  maintenanceRequest: z.string().min(1),
  tenantDocument: z.string().min(1),
  inspectionDue: z.string().min(1),
  subscribers: z.array(z.string().email()).min(1),
});
export type NotificationRequest = z.infer<typeof notificationRequest>;

export function buildFanout(request: NotificationRequest) {
  return { propertyId: request.propertyId, subscribers: request.subscribers, notice: { maintenanceRequest: request.maintenanceRequest, tenantDocument: request.tenantDocument, inspectionDue: request.inspectionDue } };
}

export async function scheduleAndPublish(input: unknown) {
  const request = notificationRequest.parse(input);
  const payload = buildFanout(request);
  const key = `property:${request.propertyId}:${request.inspectionDue}`;
  const scheduled = await infrai.cron.create({ cron_expr: "0 8 * * *", task: "https://example.com/property-notifications" }, key);
  const published = await infrai.queue.publish({ queue: process.env.INFRAI_QUEUE || "property-notifications", payload }, key);
  return { jobId: scheduled.job_id, messageId: published.message_id, recipientCount: payload.subscribers.length };
}

if (process.argv[1]?.endsWith("fanout-service.ts")) {
  const recipient = process.env.NOTIFICATION_RECIPIENT;
  if (!recipient) throw new Error("NOTIFICATION_RECIPIENT is required");
  const sample = { propertyId: "building-17", maintenanceRequest: "boiler inspection", tenantDocument: "lease-2026.pdf", inspectionDue: "2026-09-15", subscribers: [recipient] };
  scheduleAndPublish(sample).then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
