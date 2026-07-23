import { computed, onBeforeUnmount, ref } from "vue";
import type { CollabMessage } from "../types/fortune-sheet";
export function useCollaboration(applyOp: (op: unknown) => void) {
  const socket = ref<WebSocket>(); const connected = ref(false); const users = ref<string[]>([]); const error = ref("");
  const connect = async (room: string, user: string) => { socket.value?.close(); const response = await fetch(`/api/auth/demo-login?username=${encodeURIComponent(user)}`, { method: "POST" }); if (!response.ok) { error.value = "登录失败"; return; } const { token } = await response.json(); const ws = new WebSocket(`ws://${location.host}/ws?token=${encodeURIComponent(token)}`); socket.value = ws; ws.onopen = () => { connected.value = true; ws.send(JSON.stringify({ type: "join", room, user })); }; ws.onmessage = (event) => { const msg = JSON.parse(event.data) as CollabMessage; if (msg.type === "snapshot") { users.value = msg.users; window.dispatchEvent(new CustomEvent("fortune-snapshot", { detail: msg.data })); } if (msg.type === "remote-op") applyOp(msg.op); if (msg.type === "presence") users.value = msg.users; }; ws.onerror = () => { error.value = "协同服务连接失败"; }; ws.onclose = () => { connected.value = false; }; };
  const sendOp = (room: string, user: string, op: unknown) => { if (socket.value?.readyState === WebSocket.OPEN) socket.value.send(JSON.stringify({ type: "op", room, user, op })); };
  const disconnect = () => socket.value?.close();
  onBeforeUnmount(disconnect); return { connected: computed(() => connected.value), users, error, connect, sendOp, disconnect };
}

