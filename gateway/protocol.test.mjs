import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeRoom,
  parseSnapshot,
  validateOperationPayload,
} from "./protocol.mjs";

test("normalizes valid room names and rejects unsafe names", () => {
  assert.equal(normalizeRoom("  finance-demo  "), "finance-demo");
  assert.throws(() => normalizeRoom("../../admin"), /房间名称无效/);
});

test("parses both legacy JSON snapshots and array snapshots", () => {
  const snapshot = [{ id: "assessment-sheet", celldata: [] }];

  assert.deepEqual(parseSnapshot(JSON.stringify(snapshot)), snapshot);
  assert.deepEqual(parseSnapshot(snapshot), snapshot);
  assert.deepEqual(parseSnapshot(null), []);
});

test("validates a FortuneSheet operation envelope", () => {
  const payload = validateOperationPayload({
    operationId: "4b190bbd-2170-46ac-bf76-c9148aa8eb31",
    baseRevision: 4,
    ops: [{ op: "replace", id: "assessment-sheet", path: ["data", 0, 0, "v"], value: 9 }],
    snapshot: [{ id: "assessment-sheet" }],
  });

  assert.equal(payload.baseRevision, 4);
  assert.equal(payload.ops.length, 1);
  assert.equal(payload.snapshot[0].id, "assessment-sheet");
});

test("rejects malformed operation envelopes", () => {
  assert.throws(
    () => validateOperationPayload({ operationId: "", baseRevision: -1, ops: [], snapshot: [] }),
    /operationId 无效/,
  );
  assert.throws(
    () => validateOperationPayload({ operationId: "op-1", baseRevision: -1, ops: [], snapshot: [] }),
    /baseRevision 无效/,
  );
});
