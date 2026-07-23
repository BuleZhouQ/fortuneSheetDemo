import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8081, path: "/ws" });
const rooms = new Map();
const initial = [{ name: "试卷协同示例", order: 0, status: 1, row: 84, column: 60, config: {}, celldata: [{ r: 0, c: 0, v: { v: "题号", bl: 1 } }, { r: 0, c: 1, v: { v: "题目" } }, { r: 0, c: 2, v: { v: "答案" } }, { r: 1, c: 0, v: { v: 1 } }, { r: 1, c: 1, v: { v: "Vue 3 的响应式 API 是什么？" } }, { r: 1, c: 2, v: { v: "Composition API" } }, { r: 2, c: 0, v: { v: 2 } }, { r: 2, c: 1, v: { v: "2 + 3 = ?" } }, { r: 2, c: 2, v: { f: "=2+3" } }] }];
const send = (ws, payload) => ws.send(JSON.stringify(payload));
const broadcastPresence = (room) => { const state = rooms.get(room); if (!state) return; const users = [...state.clients].map(c => c.user); state.clients.forEach(c => send(c.ws, { type: "presence", users })); };
wss.on("connection", ws => { let client; ws.on("message", raw => { const msg = JSON.parse(raw); if (msg.type === "join") { const room = rooms.get(msg.room) ?? { data: structuredClone(initial), clients: new Set() }; client = { ws, room: msg.room, user: msg.user }; room.clients.add(client); rooms.set(msg.room, room); send(ws, { type: "snapshot", room: msg.room, data: room.data, users: [...room.clients].map(c => c.user) }); broadcastPresence(msg.room); } else if (msg.type === "op" && client) { const room = rooms.get(client.room); if (!room) return; if (msg.op?.snapshot) room.data = msg.op.snapshot; room.clients.forEach(other => { if (other !== client) send(other.ws, { type: "remote-op", user: client.user, op: msg.op }); }); } }); ws.on("close", () => { if (!client) return; const room = rooms.get(client.room); room?.clients.delete(client); if (room?.clients.size) broadcastPresence(client.room); else rooms.delete(client.room); }); });
console.log("FortuneSheet WebSocket server: ws://localhost:8081/ws");





