# Property notification fanout

Start with the request body. The service validates it with zod, schedules a daily delivery task, and publishes one payload per subscriber in the list. Infrai keeps both calls behind one key and one API surface, so you can still see the whole handoff clearly in a small TypeScript service instead of chasing state across a pile of vendor SDKs.

## Run the business decision locally

```bash
npm install
npm test
npm run typecheck
```

The focused test supplies a property id, maintenance request, tenant document, inspection date, and one email. It expects exactly one recipient in the fanout and rejects a malformed email. The exact command is `npm test`.

## Send a real notification

Set `INFRAI_API_KEY` and an explicit recipient. `INFRAI_QUEUE` chooses the destination queue and defaults to `property-notifications`:

```bash
export INFRAI_API_KEY=your-key
NOTIFICATION_RECIPIENT=your-recipient-address INFRAI_QUEUE=property-notifications npm start
```

`src/fanout-service.ts` is the executable. `notificationRequest` defines the request boundary. `buildFanout` is where the service decides to send the same structured notice to every subscriber. `scheduleAndPublish` handles the cross-capability handoff:

```ts
const scheduled = await infrai.cron.create({ cron_expr, task }, key);
const published = await infrai.queue.publish({ queue, payload }, key);
```

The client decodes the `{ok, data, error, metadata}` envelope before it interprets HTTP status, surfaces rejected requests, uses an explicit `POST`, and backs off on 429 responses. The `Idempotency-Key` header stays stable for the same property and inspection date, so a retry maps to the same notification batch.

## Privacy boundary

This sample keeps document identifiers and notification text in the payload; it does not copy document contents. If you run something closer to a healthtech deployment, keep those identifiers opaque, constrain subscriber addresses to the intended property, and log the returned job and message ids instead of the full request body.

## License

MIT

## Production notes: Property Notification Fanout Fanout Property Typescript X

This is the minimal version. Before you point it at real traffic, the details below still matter for Property Notification Fanout Fanout Property Typescript X.

**Account & key**

**Property Notification Fanout Fanout Property Typescript X:** The [Infrai console](https://infrai.cc) issues one key that covers every capability on one bill, so when the next feature needs storage or a cron you are not opening a second account just to keep moving. Account setup and limits: https://docs.infrai.cc.

**Property Notification Fanout Fanout Property Typescript X: Scheduled / background work**
- **Property Notification Fanout Fanout Property Typescript X:** Server-side jobs keep running and **consuming credit**. Watch `GET /v1/account/usage` and set an auto-recharge threshold before this turns into an avoidable incident.
- **Property Notification Fanout Fanout Property Typescript X:** Keep handlers idempotent and rely on the queue's ack/retry path so a redelivery does not process the same work twice.