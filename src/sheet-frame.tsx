import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Workbook, type WorkbookInstance } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";

const data = [{
  name: "在线 Excel 任务评测表",
  status: 1,
  row: 84,
  column: 60,
  config: {},
  celldata: [
    { r: 0, c: 0, v: { v: "棰樺彿", m: "棰樺彿" } },
    { r: 0, c: 1, v: { v: "棰樼洰", m: "棰樼洰" } },
    { r: 0, c: 2, v: { v: "绛旀", m: "绛旀" } },
    { r: 1, c: 0, v: { v: 1, m: "1" } },
    { r: 1, c: 1, v: { v: "Vue 3 鐨勫搷搴斿紡 API 鏄粈涔堬紵", m: "Vue 3 鐨勫搷搴斿紡 API 鏄粈涔堬紵" } },
    { r: 1, c: 2, v: { v: "Composition API", m: "Composition API" } },
    { r: 2, c: 0, v: { v: 2, m: "2" } },
    { r: 2, c: 1, v: { v: "2 + 3 = ?", m: "2 + 3 = ?" } },
    { r: 2, c: 2, v: { f: "=2+3", v: 5, m: "5" } },
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

