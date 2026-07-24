import * as Y from "yjs";
import type { FortuneOp } from "../types/fortune-sheet";

type WorkbookSnapshot = unknown[];

type YjsWorkbookOptions = {
  onLocalUpdate?: (update: string) => void;
  onRemoteOperations?: (operations: FortuneOp[]) => void;
  onRemoteSnapshot?: (snapshot: WorkbookSnapshot) => void;
};

const LOCAL_ORIGIN = Symbol("fortune-local");
const REMOTE_ORIGIN = Symbol("fortune-remote");
const STRUCTURAL_OPERATIONS = new Set([
  "insertRowCol",
  "deleteRowCol",
  "addSheet",
  "deleteSheet",
]);

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

export const base64ToBytes = (encoded: string): Uint8Array => {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

export class YjsWorkbook {
  private readonly doc = new Y.Doc();
  private readonly operations = this.doc.getMap<FortuneOp>("fortune-operations");
  private readonly metadata = this.doc.getMap<WorkbookSnapshot>("fortune-metadata");
  private structuralSequence = 0;

  constructor(private readonly options: YjsWorkbookOptions = {}) {
    this.doc.on("update", (update: Uint8Array, origin: unknown) => {
      if (origin === LOCAL_ORIGIN) {
        this.options.onLocalUpdate?.(bytesToBase64(update));
      }
    });

    this.operations.observe((event) => {
      if (event.transaction.origin === LOCAL_ORIGIN) return;

      const changed = [...event.keysChanged]
        .map((key) => this.operations.get(key))
        .filter((operation): operation is FortuneOp => operation !== undefined)
        .map(clone);

      if (changed.length > 0) {
        this.options.onRemoteOperations?.(changed);
      }
    });

    this.metadata.observe((event) => {
      if (
        event.transaction.origin === LOCAL_ORIGIN ||
        !event.keysChanged.has("initialSnapshot")
      ) {
        return;
      }

      const snapshot = this.metadata.get("initialSnapshot");
      if (snapshot) {
        this.options.onRemoteSnapshot?.(clone(snapshot));
      }
    });
  }

  hasSnapshot(): boolean {
    return this.metadata.has("initialSnapshot");
  }

  initializeSnapshot(snapshot: WorkbookSnapshot): void {
    if (this.hasSnapshot()) return;

    this.doc.transact(() => {
      this.metadata.set("initialSnapshot", clone(snapshot));
    }, LOCAL_ORIGIN);
  }

  publishOperations(operations: FortuneOp[]): void {
    if (operations.length === 0) return;

    this.doc.transact(() => {
      operations.forEach((operation) => {
        this.operations.set(this.operationKey(operation), clone(operation));
      });
    }, LOCAL_ORIGIN);
  }

  applyRemoteUpdate(update: string): void {
    Y.applyUpdate(this.doc, base64ToBytes(update), REMOTE_ORIGIN);
  }

  destroy(): void {
    this.doc.destroy();
  }

  private operationKey(operation: FortuneOp): string {
    if (STRUCTURAL_OPERATIONS.has(operation.op)) {
      this.structuralSequence += 1;
      return `structure:${this.doc.clientID}:${this.structuralSequence}`;
    }

    return `path:${operation.id ?? ""}:${JSON.stringify(operation.path)}`;
  }
}
