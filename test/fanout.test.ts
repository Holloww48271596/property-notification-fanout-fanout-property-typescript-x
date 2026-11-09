import assert from "node:assert/strict";
import { buildFanout, notificationRequest } from "../src/fanout-service.js";

const input = { propertyId: "p-1", maintenanceRequest: "lift repair", tenantDocument: "lease.pdf", inspectionDue: "2026-10-01", subscribers: ["tenant@example.com"] };
const parsed = notificationRequest.parse(input);
const output = buildFanout(parsed);
assert.equal(output.subscribers.length, 1);
assert.equal(output.notice.inspectionDue, "2026-10-01");
assert.throws(() => notificationRequest.parse({ ...input, subscribers: ["not-an-email"] }));
console.log("fanout decision test passed");
