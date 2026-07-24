import { describe, expect, it, vi } from "vitest";
import type { FortuneOp } from "../types/fortune-sheet";
import { YjsWorkbook } from "./YjsWorkbook";

const cellOp = (path: (string | number)[], value: unknown): FortuneOp => ({
  op: "replace",
  id: "sheet-1",
  path,
  value,
});

const applyToView = (view: Map<string, unknown>, operations: FortuneOp[]) => {
  operations.forEach((operation) => {
    view.set(JSON.stringify(operation.path), operation.value);
  });
};

describe("YjsWorkbook", () => {
  it("synchronizes the initial workbook snapshot", () => {
    const updates: string[] = [];
    const onRemoteSnapshot = vi.fn();
    const first = new YjsWorkbook({ onLocalUpdate: (update) => updates.push(update) });
    const second = new YjsWorkbook({ onRemoteSnapshot });
    const snapshot = [{ id: "sheet-1", name: "协同表格", celldata: [] }];

    first.initializeSnapshot(snapshot);
    updates.forEach((update) => second.applyRemoteUpdate(update));

    expect(onRemoteSnapshot).toHaveBeenCalledOnce();
    expect(onRemoteSnapshot).toHaveBeenCalledWith(snapshot);
  });

  it("merges concurrent edits to different cell paths", () => {
    const firstUpdates: string[] = [];
    const secondUpdates: string[] = [];
    const firstView = new Map<string, unknown>();
    const secondView = new Map<string, unknown>();
    const first = new YjsWorkbook({
      onLocalUpdate: (update) => firstUpdates.push(update),
      onRemoteOperations: (operations) => applyToView(firstView, operations),
    });
    const second = new YjsWorkbook({
      onLocalUpdate: (update) => secondUpdates.push(update),
      onRemoteOperations: (operations) => applyToView(secondView, operations),
    });
    const firstOp = cellOp(["data", 0, 0, "v"], "A");
    const secondOp = cellOp(["data", 0, 1, "v"], "B");

    applyToView(firstView, [firstOp]);
    applyToView(secondView, [secondOp]);
    first.publishOperations([firstOp]);
    second.publishOperations([secondOp]);
    firstUpdates.forEach((update) => second.applyRemoteUpdate(update));
    secondUpdates.forEach((update) => first.applyRemoteUpdate(update));

    expect(Object.fromEntries(firstView)).toEqual(Object.fromEntries(secondView));
    expect([...firstView.values()].sort()).toEqual(["A", "B"]);
  });

  it("converges concurrent edits to the same cell path", () => {
    const firstUpdates: string[] = [];
    const secondUpdates: string[] = [];
    const firstView = new Map<string, unknown>();
    const secondView = new Map<string, unknown>();
    const first = new YjsWorkbook({
      onLocalUpdate: (update) => firstUpdates.push(update),
      onRemoteOperations: (operations) => applyToView(firstView, operations),
    });
    const second = new YjsWorkbook({
      onLocalUpdate: (update) => secondUpdates.push(update),
      onRemoteOperations: (operations) => applyToView(secondView, operations),
    });
    const firstOp = cellOp(["data", 2, 2, "v"], "Alice");
    const secondOp = cellOp(["data", 2, 2, "v"], "Bob");

    applyToView(firstView, [firstOp]);
    applyToView(secondView, [secondOp]);
    first.publishOperations([firstOp]);
    second.publishOperations([secondOp]);
    firstUpdates.forEach((update) => second.applyRemoteUpdate(update));
    secondUpdates.forEach((update) => first.applyRemoteUpdate(update));

    expect(Object.fromEntries(firstView)).toEqual(Object.fromEntries(secondView));
    expect([...firstView.values()][0]).toMatch(/Alice|Bob/);
  });

  it("does not echo an update applied from another client", () => {
    const updates: string[] = [];
    const echoedUpdates: string[] = [];
    const first = new YjsWorkbook({ onLocalUpdate: (update) => updates.push(update) });
    const second = new YjsWorkbook({ onLocalUpdate: (update) => echoedUpdates.push(update) });

    first.publishOperations([cellOp(["data", 1, 1, "v"], 42)]);
    second.applyRemoteUpdate(updates[0]);

    expect(echoedUpdates).toEqual([]);
  });
});
