export type FortuneOp = {
  op: "replace" | "remove" | "add" | "insertRowCol" | "deleteRowCol" | "addSheet" | "deleteSheet";
  id?: string;
  path: (string | number)[];
  value?: unknown;
};

export type RemoteOperationMessage = {
  operationId: string;
  revision: number;
  user: string;
  ops: FortuneOp[];
};
