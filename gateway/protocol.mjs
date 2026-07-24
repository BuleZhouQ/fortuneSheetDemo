const ROOM_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_OPERATION_BYTES = 2 * 1024 * 1024;

export function normalizeRoom(value) {
  const room = typeof value === "string" ? value.trim() : "";
  if (!ROOM_PATTERN.test(room)) {
    throw new Error("房间名称无效");
  }
  return room;
}

export function parseSnapshot(value) {
  if (value == null) return [];
  const snapshot = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(snapshot)) {
    throw new Error("工作簿快照无效");
  }
  return structuredClone(snapshot);
}

export function validateOperationPayload(value) {
  if (!value || typeof value !== "object") {
    throw new Error("操作数据无效");
  }

  const operationId = typeof value.operationId === "string" ? value.operationId.trim() : "";
  if (operationId.length === 0 || operationId.length > 128) {
    throw new Error("operationId 无效");
  }
  if (!Number.isInteger(value.baseRevision) || value.baseRevision < 0) {
    throw new Error("baseRevision 无效");
  }
  if (!Array.isArray(value.ops) || value.ops.length === 0) {
    throw new Error("FortuneSheet 操作无效");
  }

  const snapshot = parseSnapshot(value.snapshot);
  const normalized = {
    operationId,
    baseRevision: value.baseRevision,
    ops: structuredClone(value.ops),
    snapshot,
  };
  if (Buffer.byteLength(JSON.stringify(normalized), "utf8") > MAX_OPERATION_BYTES) {
    throw new Error("操作数据过大");
  }
  return normalized;
}
