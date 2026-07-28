# 10 万行 × 20 列性能测试 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 FortuneSheet 一次性生成并加载 100,000 行、20 列、共 2,000,000 个真实测试单元格。

**Architecture:** 将大数据生成逻辑从 React 渲染文件抽离到独立纯函数模块，使用确定性公式生成混合类型数据。`sheet-frame.tsx` 只负责调用生成器并把结果交给 FortuneSheet，从而使数据规模和边界可独立测试。

**Tech Stack:** TypeScript、React、FortuneSheet、Vitest、Vite

---

### Task 1: 大表格数据生成器

**Files:**
- Create: `src/large-sheet-data.ts`
- Create: `src/large-sheet-data.test.ts`

- [ ] **Step 1: 编写失败测试**

```ts
import { describe, expect, it } from "vitest";
import { createLargeSheetData } from "./large-sheet-data";

describe("createLargeSheetData", () => {
  it("生成 10 万行、20 列和 200 万个单元格", () => {
    const sheet = createLargeSheetData();
    expect(sheet.row).toBe(100_000);
    expect(sheet.column).toBe(20);
    expect(sheet.celldata).toHaveLength(2_000_000);
    expect(sheet.celldata[0]).toMatchObject({ r: 0, c: 0 });
    expect(sheet.celldata.at(-1)).toMatchObject({ r: 99_999, c: 19 });
  });

  it("使用确定性的混合测试值", () => {
    const sheet = createLargeSheetData(3, 20);
    expect(sheet.celldata[20].v.v).toBe("ROW-000001");
    expect(sheet.celldata[21].v.v).toBe("性能测试记录 1");
    expect(sheet.celldata[24].v.v).toBe(1001);
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npx vitest run src/large-sheet-data.test.ts`

Expected: FAIL，提示 `./large-sheet-data` 模块不存在。

- [ ] **Step 3: 实现最小数据生成器**

在 `src/large-sheet-data.ts` 中定义 `createLargeSheetData(rows = 100_000, columns = 20)`：

```ts
const HEADERS = [
  "记录编号", "名称", "部门", "分类", "数量", "单价", "金额", "日期", "状态", "负责人",
  "区域", "城市", "渠道", "优先级", "完成率", "评分", "批次", "备注", "更新时间", "校验值",
];

export function createLargeSheetData(rows = 100_000, columns = 20) {
  const celldata = new Array(rows * columns);
  let index = 0;

  for (let c = 0; c < columns; c += 1) {
    celldata[index++] = { r: 0, c, v: { v: HEADERS[c], bl: 1, bg: "#f4f6f8" } };
  }

  for (let r = 1; r < rows; r += 1) {
    const values = [
      `ROW-${String(r).padStart(6, "0")}`, `性能测试记录 ${r}`, `部门${r % 20}`,
      `分类${r % 12}`, 1000 + r, Number((10 + (r % 500) / 10).toFixed(2)),
      Number(((1000 + r) * (10 + (r % 500) / 10)).toFixed(2)),
      `2026-${String((r % 12) + 1).padStart(2, "0")}-${String((r % 28) + 1).padStart(2, "0")}`,
      r % 3 === 0 ? "完成" : "处理中", `用户${r % 100}`, `区域${r % 8}`,
      `城市${r % 50}`, `渠道${r % 6}`, r % 4, r % 101, (r % 50) / 10,
      `BATCH-${r % 1000}`, `第 ${r} 行性能测试数据`, `2026-07-27 09:${String(r % 60).padStart(2, "0")}`,
      (r * 31) % 100000,
    ];
    for (let c = 0; c < columns; c += 1) {
      celldata[index++] = { r, c, v: { v: values[c] } };
    }
  }

  return {
    id: "performance-sheet",
    name: "10万行性能测试",
    status: 1,
    row: rows,
    column: columns,
    config: { colwidth: Object.fromEntries(Array.from({ length: columns }, (_, c) => [c, c === 1 || c === 17 ? 180 : 110])) },
    celldata,
  };
}
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `npx vitest run src/large-sheet-data.test.ts`

Expected: 2 tests PASS。

### Task 2: 接入 FortuneSheet

**Files:**
- Modify: `src/sheet-frame.tsx`

- [ ] **Step 1: 替换现有小数据集**

导入生成器并仅在模块初始化时生成一次：

```ts
import { createLargeSheetData } from "./large-sheet-data";

console.time("generate-100k-x-20-sheet");
const data = [createLargeSheetData()];
console.timeEnd("generate-100k-x-20-sheet");
```

删除原有内联 `data`，并把远程快照边界调整为：

```ts
snapshot[0].row = Math.max(snapshot[0].row || 0, 100_000);
snapshot[0].column = Math.max(snapshot[0].column || 0, 20);
```

- [ ] **Step 2: 执行完整测试**

Run: `npm test -- --run`

Expected: 所有 Vitest 测试通过。

- [ ] **Step 3: 执行构建**

Run: `npm run build`

Expected: `vue-tsc --noEmit && vite build` 成功，退出码为 0。

### Task 3: 浏览器性能冒烟验证

**Files:**
- Verify: `http://localhost:5000/sheet.html`

- [ ] **Step 1: 刷新开发页面**

打开 `http://localhost:5000/`，等待工作表生成并渲染。

- [ ] **Step 2: 检查运行结果**

确认页面显示 20 列，能滚动访问后续行；开发者控制台出现
`generate-100k-x-20-sheet` 耗时且无未捕获异常。

- [ ] **Step 3: 记录验证结论**

汇报数据生成、自动测试、构建和浏览器冒烟验证结果，不执行 Git 写操作。
