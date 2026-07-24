import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import { io, type Socket } from "socket.io-client";
import type { FortuneOp, RemoteOperationMessage } from "../types/fortune-sheet";

type CollaborationCallbacks = {
  applyOperations: (operations: FortuneOp[]) => void;
  applySnapshot: (snapshot: unknown[]) => void;
};
type ConnectionOptions = { room: string; user: string; initialSnapshot: unknown[] };
type GatewayResponse = {
  ok: boolean;
  message?: string;
  revision?: number;
  snapshot?: unknown[];
  users?: string[];
};

export function useCollaboration(callbacks: CollaborationCallbacks) {
  const socket = shallowRef<Socket>();
  const connected = ref(false);
  const users = ref<string[]>([]);
  const error = ref("");
  const revision = ref(0);
  let connection: ConnectionOptions | undefined;

  const joinRoom = () => {
    if (!socket.value || !connection) return;
    socket.value.emit(
      "collab:join",
      { room: connection.room, lastRevision: revision.value, initialSnapshot: connection.initialSnapshot },
      (response: GatewayResponse) => {
        if (!response.ok || !response.snapshot || response.revision === undefined) {
          error.value = response.message || "加入协同房间失败";
          connected.value = false;
          return;
        }
        revision.value = response.revision;
        users.value = response.users ?? [];
        callbacks.applySnapshot(response.snapshot);
        error.value = "";
        connected.value = true;
      },
    );
  };

  const disconnect = () => {
    connected.value = false;
    users.value = [];
    socket.value?.removeAllListeners();
    socket.value?.disconnect();
    socket.value = undefined;
  };

  const connect = async (options: ConnectionOptions) => {
    disconnect();
    connection = options;
    error.value = "";
    revision.value = 0;
    const response = await fetch(`/api/auth/login?username=${encodeURIComponent(options.user)}`, { method: "POST" });
    if (!response.ok) {
      error.value = "协同登录失败";
      return;
    }

    const { token } = (await response.json()) as { token: string };
    const client = io({
      path: "/socket.io",
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
    socket.value = client;
    client.on("connect", joinRoom);
    client.on("collab:presence", (message: { users: string[] }) => {
      users.value = message.users;
    });
    client.on("collab:op", (message: RemoteOperationMessage) => {
      if (message.revision <= revision.value) return;
      callbacks.applyOperations(message.ops);
      revision.value = message.revision;
    });
    client.on("connect_error", (reason) => {
      connected.value = false;
      error.value = reason.message || "Socket.IO 网关连接失败";
    });
    client.on("disconnect", () => {
      connected.value = false;
      users.value = [];
    });
  };

  const publishOperations = (operations: FortuneOp[], snapshot: unknown[]) => {
    const client = socket.value;
    if (!client?.connected || !connected.value) {
      error.value = "协同已断开，本次修改未保存";
      return;
    }

    client.timeout(5000).emit(
      "collab:op",
      { operationId: crypto.randomUUID(), baseRevision: revision.value, ops: operations, snapshot },
      (timeoutError: Error | null, response?: GatewayResponse) => {
        if (timeoutError || !response?.ok || response.revision === undefined) {
          error.value = response?.message || "协同操作保存超时";
          return;
        }
        revision.value = Math.max(revision.value, response.revision);
        error.value = "";
      },
    );
  };

  onBeforeUnmount(disconnect);
  return {
    connected: computed(() => connected.value),
    users,
    error,
    revision: computed(() => revision.value),
    connect,
    publishOperations,
    disconnect,
  };
}
