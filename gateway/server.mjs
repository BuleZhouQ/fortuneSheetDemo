import { createServer } from "node:http";
import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";
import { createClient } from "redis";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { normalizeRoom, parseSnapshot, validateOperationPayload } from "./protocol.mjs";
import { RoomSequencer } from "./room-sequencer.mjs";

const port = Number(process.env.GATEWAY_PORT ?? 8082);
const mongoUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/fortune_sheet_collab";
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379/8";
const jwtSecret = process.env.JWT_SECRET ?? "fortune-sheet-demo-secret-key-change-me-2026";

const mongo = new MongoClient(mongoUri);
await mongo.connect();
const database = mongo.db();
const workbooks = database.collection("collaboration_workbooks");
const members = database.collection("collaboration_members");
const operations = database.collection("collaboration_operations");
await Promise.all([
  workbooks.createIndex({ roomId: 1 }, { unique: true }),
  members.createIndex({ roomId: 1, username: 1 }, { unique: true }),
  operations.createIndex({ roomId: 1, operationId: 1 }, { unique: true, sparse: true }),
  operations.createIndex({ roomId: 1, revision: 1 }),
]);

const publisher = createClient({ url: redisUrl });
const subscriber = publisher.duplicate();
const stateRedis = publisher.duplicate();
await Promise.all([publisher.connect(), subscriber.connect(), stateRedis.connect()]);

const httpServer = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ status: "ok", service: "fortune-sheet-socketio-gateway" }));
    return;
  }
  response.writeHead(404).end();
});
const io = new Server(httpServer, {
  path: "/socket.io",
  cors: { origin: true, credentials: true },
  maxHttpBufferSize: 2 * 1024 * 1024,
  transports: ["websocket"],
});
io.adapter(createAdapter(publisher, subscriber));
const sequencer = new RoomSequencer();

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || token.length === 0) return next(new Error("缺少登录凭证"));
    const claims = jwt.verify(token, jwtSecret);
    if (typeof claims !== "object" || typeof claims.sub !== "string") return next(new Error("登录凭证无效"));
    socket.data.username = claims.sub;
    socket.data.role = claims.role ?? "EDITOR";
    next();
  } catch {
    next(new Error("登录凭证无效或已过期"));
  }
});

async function ensureWorkbook(room, initialSnapshot, username) {
  const now = new Date();
  await workbooks.updateOne(
    { roomId: room },
    { $setOnInsert: { roomId: room, revision: 0, snapshot: JSON.stringify(parseSnapshot(initialSnapshot)), updatedBy: username, updatedAt: now } },
    { upsert: true },
  );
  return workbooks.findOne({ roomId: room });
}

async function roomUsers(room) {
  const sockets = await io.in(room).fetchSockets();
  return [...new Set(sockets.map((item) => item.data.username).filter(Boolean))];
}

async function publishPresence(room) {
  io.to(room).emit("collab:presence", { users: await roomUsers(room) });
}

io.on("connection", (socket) => {
  socket.on("collab:join", async (payload, acknowledge = () => undefined) => {
    try {
      const room = normalizeRoom(payload?.room);
      const previousRoom = socket.data.room;
      if (previousRoom && previousRoom !== room) {
        await socket.leave(previousRoom);
        await publishPresence(previousRoom);
      }
      const workbook = await sequencer.run(room, () => ensureWorkbook(room, payload?.initialSnapshot, socket.data.username));
      await members.updateOne(
        { roomId: room, username: socket.data.username },
        { $setOnInsert: { roomId: room, username: socket.data.username, role: socket.data.role } },
        { upsert: true },
      );
      await socket.join(room);
      socket.data.room = room;
      await stateRedis.setNX(`collab:room:${room}:revision`, String(workbook.revision ?? 0));
      const users = await roomUsers(room);
      acknowledge({ ok: true, room, revision: workbook.revision ?? 0, snapshot: parseSnapshot(workbook.snapshot), users });
      io.to(room).emit("collab:presence", { users });
    } catch (error) {
      acknowledge({ ok: false, message: error instanceof Error ? error.message : "加入协同房间失败" });
    }
  });

  socket.on("collab:op", async (payload, acknowledge = () => undefined) => {
    const room = socket.data.room;
    if (!room) return acknowledge({ ok: false, message: "尚未加入协同房间" });
    try {
      const operation = validateOperationPayload(payload);
      const result = await sequencer.run(room, async () => {
        const duplicate = await operations.findOne({ roomId: room, operationId: operation.operationId });
        if (duplicate) return { duplicate: true, revision: duplicate.revision, stale: false };
        const workbook = await workbooks.findOne({ roomId: room });
        const currentRevision = workbook?.revision ?? 0;
        if (operation.baseRevision > currentRevision) throw new Error("客户端 revision 超前，请重新同步");
        const revision = currentRevision + 1;
        const now = new Date();
        await workbooks.updateOne(
          { roomId: room },
          { $set: { revision, snapshot: JSON.stringify(operation.snapshot), updatedBy: socket.data.username, updatedAt: now } },
        );
        await operations.insertOne({
          roomId: room,
          revision,
          operationId: operation.operationId,
          username: socket.data.username,
          operations: JSON.stringify(operation.ops),
          kind: "socketio-op",
          createdAt: now,
        });
        await stateRedis.set(`collab:room:${room}:revision`, String(revision));
        return { duplicate: false, revision, stale: operation.baseRevision < currentRevision };
      });
      if (!result.duplicate) {
        socket.to(room).emit("collab:op", { operationId: operation.operationId, revision: result.revision, user: socket.data.username, ops: operation.ops });
      }
      acknowledge({ ok: true, revision: result.revision, stale: result.stale });
    } catch (error) {
      acknowledge({ ok: false, message: error instanceof Error ? error.message : "保存协同操作失败" });
    }
  });

  socket.on("disconnect", () => {
    if (socket.data.room) void publishPresence(socket.data.room);
  });
});

httpServer.listen(port, "0.0.0.0", () => console.log(`Socket.IO collaboration gateway: http://127.0.0.1:${port}`));

async function shutdown() {
  await new Promise((resolve) => io.close(resolve));
  await Promise.allSettled([publisher.quit(), subscriber.quit(), stateRedis.quit(), mongo.close()]);
  httpServer.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
