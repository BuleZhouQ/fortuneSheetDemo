export type FortuneOp = {
  op:
    | "replace"
    | "remove"
    | "add"
    | "insertRowCol"
    | "deleteRowCol"
    | "addSheet"
    | "deleteSheet";
  id?: string;
  path: (string | number)[];
  value?: unknown;
};

export type CollabMessage =
  | { type: "join"; room: string }
  | { type: "sync"; room: string; updates: string[]; users: string[] }
  | { type: "y-update"; update: string; user?: string; revision?: number }
  | { type: "presence"; users: string[] }
  | { type: "error"; message: string };
