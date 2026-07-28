import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Workbook, type WorkbookInstance } from "@fortune-sheet/react";
import { createVirtualSheetData } from "./large-sheet-data";
import "@fortune-sheet/react/dist/index.css";

const legacyData = [{
  id: "assessment-sheet",
  name: "在线 Excel 评测",
  status: 1,
  row: 84,
  column: 26,
  config: {
    colwidth: { 0: 100, 1: 180, 2: 180, 3: 220 }
  },
  celldata: [
    { r: 0, c: 0, v: { v: "编号", bl: 1, ht: "1", bg: "#f4f6f8" } },
    { r: 0, c: 1, v: { v: "考核项目名称", bl: 1, ht: "1", bg: "#f4f6f8" } },
    { r: 0, c: 2, v: { v: "数值/公式填写区", bl: 1, ht: "1", bg: "#f4f6f8" } },
    { r: 0, c: 3, v: { v: "备注说明", bl: 1, ht: "1", bg: "#f4f6f8" } },

    { r: 2, c: 0, v: { v: "A-01" } },
    { r: 2, c: 1, v: { v: "一季度销售额" } },
    { r: 2, c: 2, v: { v: 35000, m: "35000" } },
    { r: 2, c: 3, v: { v: "基础原始数据" } },

    { r: 3, c: 0, v: { v: "A-02" } },
    { r: 3, c: 1, v: { v: "二季度销售额" } },
    { r: 3, c: 2, v: { v: 42000, m: "42000" } },
    { r: 3, c: 3, v: { v: "基础原始数据" } },

    { r: 4, c: 0, v: { v: "A-03" } },
    { r: 4, c: 1, v: { v: "三季度销售额" } },
    { r: 4, c: 2, v: { v: 38000, m: "38000" } },
    { r: 4, c: 3, v: { v: "基础原始数据" } },

    { r: 5, c: 0, v: { v: "A-04" } },
    { r: 5, c: 1, v: { v: "四季度销售额" } },
    { r: 5, c: 2, v: { v: 43000, m: "43000" } },
    { r: 5, c: 3, v: { v: "基础原始数据" } },

    { r: 6, c: 0, v: { v: "T-01", bl: 1 } },
    { r: 6, c: 1, v: { v: "季度销售总额 (SUM)", bl: 1 } },
    { r: 6, c: 2, v: { v: "", m: "" } },
    { r: 6, c: 3, v: { v: "请使用 SUM 函数计算区间 C3:C6" } },

    { r: 7, c: 0, v: { v: "T-02", bl: 1 } },
    { r: 7, c: 1, v: { v: "月度平均销售额 (AVERAGE)", bl: 1 } },
    { r: 7, c: 2, v: { v: "", m: "" } },
    { r: 7, c: 3, v: { v: "请使用 AVERAGE 函数计算区间 C3:C6" } },

    { r: 8, c: 0, v: { v: "T-03", bl: 1 } },
    { r: 8, c: 1, v: { v: "应缴增值税率 (13%)", bl: 1 } },
    { r: 8, c: 2, v: { v: "", m: "" } },
    { r: 8, c: 3, v: { v: "基于总额 C7 乘以 0.13" } },

    { r: 9, c: 0, v: { v: "T-04", bl: 1 } },
    { r: 9, c: 1, v: { v: "税后净利润占比分析", bl: 1 } },
    { r: 9, c: 2, v: { v: "", m: "" } },
    { r: 9, c: 3, v: { v: "使用 IF 函数判定 C7 > 100000" } }
  ],
}];

const data = [createVirtualSheetData()];
const performanceMode = true;
document.documentElement.dataset.performanceRows = String(data[0].row);
document.documentElement.dataset.performanceColumns = String(data[0].column);
document.documentElement.dataset.performanceCells = String(data[0].celldata.length);
void legacyData;

function SheetFrame() {
  const workbook = useRef<WorkbookInstance>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const applyingRemote = useRef(false);
  const [sheets, setSheets] = useState(data);
  const [sheetKey, setSheetKey] = useState(0);

  useEffect(() => {
    const rootEl = containerRef.current;
    if (!rootEl) return;

    const loadedBlocks = new Set<number>();
    const loadingBlocks = new Set<number>();
    let scrollElement: HTMLElement | null = null;
    let timer = 0;

    const loadBlock = async (blockStart: number) => {
      const offset = Math.max(0, Math.min(blockStart, 99_800));
      if (loadedBlocks.has(offset) || loadingBlocks.has(offset)) return;
      loadingBlocks.add(offset);
      try {
        const response = await fetch(`/api/performance/rows?offset=${offset}&limit=200`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const rows = payload.rows as Array<{ rowNumber: number; values: Array<string | number> }>;
        if (!rows.length) return;
        const matrix = rows.map((row) =>
          row.values.map((value) =>
            typeof value === "number" ? { v: value, m: String(value) } : { v: value },
          ),
        );
        workbook.current?.setCellValuesByRange(
          matrix,
          { row: [rows[0].rowNumber, rows[rows.length - 1].rowNumber], column: [0, 19] },
          { id: "performance-sheet" },
        );
        loadedBlocks.add(offset);
        document.documentElement.dataset.performanceCells = String(loadedBlocks.size * 4_000);
      } catch (error) {
        console.error("[virtual-sheet] 加载可视区域失败", error);
      } finally {
        loadingBlocks.delete(offset);
      }
    };

    const loadVisibleRows = () => {
      const startRow = Math.floor((scrollElement?.scrollTop ?? 0) / 20);
      const blockStart = Math.floor(startRow / 200) * 200;
      void loadBlock(blockStart);
      void loadBlock(blockStart + 200);
    };

    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(loadVisibleRows, 60);
    };

    const setup = () => {
      scrollElement = rootEl.querySelector<HTMLElement>(".luckysheet-scrollbar-y");
      if (!scrollElement) {
        timer = window.setTimeout(setup, 100);
        return;
      }
      scrollElement.addEventListener("scroll", onScroll, { passive: true });
      loadVisibleRows();
    };
    setup();

    return () => {
      window.clearTimeout(timer);
      scrollElement?.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const postState = () => {
      parent.postMessage(
        { type: "fortune-state", snapshot: workbook.current?.getAllSheets() },
        location.origin
      );
    };

    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.data?.type !== "fortune-remote-op") return;
      applyingRemote.current = true;
      if (event.data.snapshot) {
        const snapshot = JSON.parse(JSON.stringify(event.data.snapshot));
        if (snapshot[0]) {
          snapshot[0].row = Math.max(snapshot[0].row || 0, 100_000);
          snapshot[0].column = Math.max(snapshot[0].column || 0, 20);
        }
        setSheets(snapshot);
        setSheetKey((prev) => prev + 1);
        setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
          postState();
          applyingRemote.current = false;
        }, 50);
      } else if (event.data.op) {
        workbook.current?.applyOp(event.data.op);
        setTimeout(() => {
          postState();
          applyingRemote.current = false;
        }, 0);
      } else {
        applyingRemote.current = false;
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  // WPS 风格: 智能监听到滚轮触底自动追加行 & 向右超界追加列
  useEffect(() => {
    const rootEl = containerRef.current;
    if (!rootEl) return;

    let isExpanding = false;

    const handleWheel = (e: WheelEvent) => {
      // 仅当用户向下滚动滚轮时触发判定
      if (e.deltaY <= 0 || isExpanding) return;

      const scrollable = rootEl.querySelector(".luckysheet-scrollbar-y") || rootEl;
      const { scrollTop, scrollHeight, clientHeight } = scrollable as HTMLElement;

      // 如果滚动到了距离底部 20px 以内，自动向追加 20 行
      if (scrollHeight > 0 && scrollTop + clientHeight >= scrollHeight - 20) {
        isExpanding = true;
        setSheets((prevSheets) => {
          const cloned = JSON.parse(JSON.stringify(prevSheets));
          if (cloned[0]) {
            cloned[0].row = (cloned[0].row || 84) + 20;
          }
          return cloned;
        });

        setTimeout(() => {
          isExpanding = false;
        }, 300);
      }
    };

    rootEl.addEventListener("wheel", handleWheel, { passive: true });
    return () => rootEl.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <Workbook
        key={sheetKey}
        ref={workbook}
        data={sheets}
        showtoolbar={true}
        showinfobar={false}
        showsheetbar={true}
        showstatisticBar={false}
        allowEdit={true}
        onOp={(op) => {
          if (applyingRemote.current) return;
          window.setTimeout(() => {
            parent.postMessage(
              {
                type: "fortune-op",
                op,
                ...(performanceMode ? {} : { snapshot: workbook.current?.getAllSheets() }),
              },
              location.origin
            );
          }, 0);
        }}
      />
    </div>
  );
}

document.documentElement.style.height = "100%";
document.body.style.cssText = "height:100%;margin:0;overflow:hidden";
document.getElementById("sheet-root")!.style.height = "100%";

// 工业级精简 CSS：消除底部 22px 的 fortune-stat-area 占位容器，使真正的底栏无缝沉底
const hideStyle = document.createElement("style");
hideStyle.innerHTML = `
  html, body, #sheet-root {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  /* 干掉紧跟在 luckysheet-sheet-area 下方占位 22px 的 fortune-stat-area 容器 */
  .fortune-stat-area,
  div.fortune-stat-area {
    display: none !important;
    height: 0 !important;
    min-height: 0 !important;
    max-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
  }

  /* 消除旧式追加行占位控件，防止留白 */
  .luckysheet-bottom-controll-row,
  div[class*="bottom-controll-row"],
  .fortune-bottom-controll-row,
  #luckysheet-bottom-add-row,
  #luckysheet-bottom-add-row-input,
  #luckysheet-bottom-return-top {
    display: none !important;
    height: 0 !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
  }
`;
document.head.appendChild(hideStyle);

createRoot(document.getElementById("sheet-root")!).render(<SheetFrame />);
