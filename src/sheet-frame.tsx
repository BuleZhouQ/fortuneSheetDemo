import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Workbook, type WorkbookInstance } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";

const data = [{
  name: "在线 Excel 评测",
  status: 1,
  row: 20,
  column: 10,
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
    { r: 6, c: 2, v: { f: "=SUM(C3:C5)", v: 115000, m: "115000" } },
    { r: 6, c: 3, v: { v: "请使用 SUM 函数计算" } },

    { r: 7, c: 0, v: { v: "T-02", bl: 1 } },
    { r: 7, c: 1, v: { v: "月度平均销售额 (AVERAGE)", bl: 1 } },
    { r: 7, c: 2, v: { v: 39500, m: "39500" } },
    { r: 7, c: 3, v: { v: "请使用 AVERAGE 函数计算" } },

    { r: 8, c: 0, v: { v: "T-03", bl: 1 } },
    { r: 8, c: 1, v: { v: "应缴增值税率 (13%)", bl: 1 } },
    { r: 8, c: 2, v: { f: "=C7*0.13", v: 14950, m: "14950" } },
    { r: 8, c: 3, v: { v: "基于总额乘以 0.13" } },

    { r: 9, c: 0, v: { v: "T-04", bl: 1 } },
    { r: 9, c: 1, v: { v: "税后净利润占比分析", bl: 1 } },
    { r: 9, c: 2, v: { f: '=IF(C7>100000,"达标","未达标")', v: "达标", m: "达标" } },
    { r: 9, c: 3, v: { v: "使用 IF 函数判定" } }
  ],
}];

function SheetFrame() {
  const workbook = useRef<WorkbookInstance>(null);
  const [sheets, setSheets] = useState(data);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.data?.type !== "fortune-remote-op") return;
      if (event.data.snapshot) { console.log("remote snapshot", event.data.snapshot[0]?.data?.[12]?.[7]?.v); setSheets(event.data.snapshot); }
      else workbook.current?.applyOp(event.data.op);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  return <Workbook ref={workbook} data={sheets} onOp={(op) => {
    window.setTimeout(() => parent.postMessage({ type: "fortune-op", op, snapshot: workbook.current?.getAllSheets() }, location.origin), 0);
  }} />;
}

document.documentElement.style.height = "100%";
document.body.style.cssText = "height:100%;margin:0;overflow:hidden";
document.getElementById("sheet-root")!.style.height = "100%";
createRoot(document.getElementById("sheet-root")!).render(<SheetFrame />);

