import { describe, expect, it } from "vitest";
import { createLargeSheetData, createVirtualSheetData } from "./large-sheet-data";

describe("createLargeSheetData", () => {
  it("生成 10 万行、20 列和 200 万个单元格", () => {
    const sheet = createLargeSheetData();

    expect(sheet.row).toBe(100_000);
    expect(sheet.column).toBe(20);
    expect(sheet.celldata).toHaveLength(2_000_000);
    expect(sheet.celldata[0]).toMatchObject({ r: 0, c: 0 });
    expect(sheet.celldata[sheet.celldata.length - 1]).toMatchObject({ r: 99_999, c: 19 });
  });

  it("使用确定性的混合测试值", () => {
    const sheet = createLargeSheetData(3, 20);

    expect(sheet.celldata[20].v.v).toBe("ROW-000001");
    expect(sheet.celldata[21].v.v).toBe("性能测试记录 1");
    expect(sheet.celldata[24].v.v).toBe(1001);
    expect(sheet.celldata[24].v.m).toBe("1001");
    expect(sheet.celldata[33].v.v).toBe(1);
    expect(sheet.celldata[33].v.m).toBe("1");
  });
});

describe("createVirtualSheetData", () => {
  it("保留十万行滚动范围但只初始化表头", () => {
    const sheet = createVirtualSheetData();

    expect(sheet.row).toBe(100_000);
    expect(sheet.column).toBe(20);
    expect(sheet.celldata).toHaveLength(20);
  });
});
