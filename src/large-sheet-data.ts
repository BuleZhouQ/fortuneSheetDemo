const HEADERS = [
  "记录编号",
  "名称",
  "部门",
  "分类",
  "数量",
  "单价",
  "金额",
  "日期",
  "状态",
  "负责人",
  "区域",
  "城市",
  "渠道",
  "优先级",
  "完成率",
  "评分",
  "批次",
  "备注",
  "更新时间",
  "校验值",
];

type CellValue = string | number;

export interface LargeSheetCell {
  r: number;
  c: number;
  v: {
    v: CellValue;
    m?: string;
    bl?: number;
    bg?: string;
  };
}

export function createLargeSheetData(rows = 100_000, columns = 20) {
  const celldata = new Array<LargeSheetCell>(rows * columns);
  let index = 0;

  for (let c = 0; c < columns; c += 1) {
    celldata[index++] = {
      r: 0,
      c,
      v: { v: HEADERS[c] ?? `字段${c + 1}`, bl: 1, bg: "#f4f6f8" },
    };
  }

  for (let r = 1; r < rows; r += 1) {
    const values: CellValue[] = [
      `ROW-${String(r).padStart(6, "0")}`,
      `性能测试记录 ${r}`,
      `部门${r % 20}`,
      `分类${r % 12}`,
      1000 + r,
      Number((10 + (r % 500) / 10).toFixed(2)),
      Number(((1000 + r) * (10 + (r % 500) / 10)).toFixed(2)),
      `2026-${String((r % 12) + 1).padStart(2, "0")}-${String((r % 28) + 1).padStart(2, "0")}`,
      r % 3 === 0 ? "完成" : "处理中",
      `用户${r % 100}`,
      `区域${r % 8}`,
      `城市${r % 50}`,
      `渠道${r % 6}`,
      r % 4,
      r % 101,
      (r % 50) / 10,
      `BATCH-${r % 1000}`,
      `第 ${r} 行性能测试数据`,
      `2026-07-27 09:${String(r % 60).padStart(2, "0")}`,
      (r * 31) % 100000,
    ];

    for (let c = 0; c < columns; c += 1) {
      const value = values[c] ?? "";
      celldata[index++] = {
        r,
        c,
        v: typeof value === "number" ? { v: value, m: String(value) } : { v: value },
      };
    }
  }

  return {
    id: "performance-sheet",
    name: "10万行性能测试",
    status: 1,
    row: rows,
    column: columns,
    config: {
      colwidth: Object.fromEntries(
        Array.from({ length: columns }, (_, c) => [c, c === 1 || c === 17 ? 180 : 110]),
      ),
    },
    celldata,
  };
}

export function createVirtualSheetData(rows = 100_000, columns = 20) {
  return {
    id: "performance-sheet",
    name: "10万行 MongoDB 虚拟表",
    status: 1,
    row: rows,
    column: columns,
    config: {
      colwidth: Object.fromEntries(
        Array.from({ length: columns }, (_, c) => [c, c === 1 || c === 17 ? 180 : 110]),
      ),
    },
    celldata: Array.from({ length: columns }, (_, c) => ({
      r: 0,
      c,
      v: { v: HEADERS[c] ?? `字段${c + 1}`, bl: 1, bg: "#f4f6f8" },
    })),
  };
}
