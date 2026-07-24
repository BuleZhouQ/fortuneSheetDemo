import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import { YjsWorkbook } from "../collaboration/YjsWorkbook";
import type { CollabMessage, FortuneOp } from "../types/fortune-sheet";

type CollaborationCallbacks = {
  applyOperations: (operations: FortuneOp[]) => void;
  applySnapshot: (snapshot: unknown[]) => void;
};

type ConnectionOptions = {
  room: string;
  user: string;
  initialSnapshot: unknown[];
};

export function useCollaboration(callbacks: CollaborationCallbacks) {
  const socket = shallowRef<WebSocket>();
  const connected = ref(false);
  const users = ref<string[]>([]);
  const error = ref("");
  let workbook: YjsWorkbook | undefined;
  let synced = false;
  let pendingOperations: FortuneOp[][] = [];

  const sendUpdate = (update: string) => {
    if (socket.value?.readyState !== WebSocket.OPEN || !synced) return;
    socket.value.send(JSON.stringify({ type: "y-update", update }));
  };

  const disconnect = () => {
    synced = false;
    connected.value = false;
    users.value = [];
    pendingOperations = [];
    const activeSocket = socket.value;
    socket.value = undefined;
    activeSocket?.close();
    workbook?.destroy();
    workbook = undefined;
  };

  const connect = async ({ room, user, initialSnapshot }: ConnectionOptions) => {
    disconnect();
    error.value = "";

    const response = await fetch(
      `/api/auth/login?username=${encodeURIComponent(user)}`,
      { method: "POST" },
    );
    if (!response.ok) {
      error.value = "协同登录失败";
      return;
    }

    const { token } = (await response.json()) as { token: string };
    workbook = new YjsWorkbook({
      onLocalUpdate: sendUpdate,
      onRemoteOperations: callbacks.applyOperations,
      onRemoteSnapshot: callbacks.applySnapshot,
    });

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${location.host}/ws?token=${encodeURIComponent(token)}`,
    );
    socket.value = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", room }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as CollabMessage;

      if (message.type === "sync") {
        message.updates.forEach((update) => workbook?.applyRemoteUpdate(update));
        synced = true;
        if (!workbook?.hasSnapshot()) {
          workbook?.initializeSnapshot(initialSnapshot);
        }
        pendingOperations.splice(0).forEach((operations) => {
          workbook?.publishOperations(operations);
        });
        users.value = message.users;
        connected.value = true;
      } else if (message.type === "y-update") {
        workbook?.applyRemoteUpdate(message.update);
      } else if (message.type === "presence") {
        users.value = message.users;
      } else if (message.type === "error") {
        error.value = message.message;
      }
    };

    ws.onerror = () => {
      error.value = "协同服务连接失败";
    };

    ws.onclose = () => {
      if (socket.value !== ws) return;
      connected.value = false;
      synced = false;
      users.value = [];
    };
  };

  const publishOperations = (operations: FortuneOp[]) => {
    if (operations.length === 0) return;
    if (!synced || !workbook) {
      pendingOperations.push(operations);
      return;
    }
    workbook.publishOperations(operations);
  };

  onBeforeUnmount(disconnect);

  return {
    connected: computed(() => connected.value),
    users,
    error,
    connect,
    publishOperations,
    disconnect,
  };
}
