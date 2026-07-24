import { ref, computed } from "vue";

export interface StandardCellRule {
  row: number;
  col: number;
  cellRef: string;          // 单元格标识，如 C7
  title: string;            // 题目/考核点名称
  scoreWeight: number;      // 分值
  standardValue: string | number; // 标准数值/文本答案
  standardFormula?: string; // 标准公式（可选）
  errorAnalysisPrompt: string; // 错误原因指导
}

export interface CellAssessmentItem {
  row: number;
  col: number;
  cellRef: string;
  title: string;
  scoreWeight: number;
  earnedScore: number;
  isCorrect: boolean;
  studentValue: string | number;
  studentFormula?: string;
  standardValue: string | number;
  standardFormula?: string;
  errorType?: 'VALUE_MISMATCH' | 'FORMULA_MISMATCH' | 'MISSING_FORMULA' | 'NONE';
  errorAnalysisPrompt: string;
  status: 'UNCHECKED' | 'RED_ERROR' | 'YELLOW_ANALYZED' | 'CORRECT';
}

const BACKEND_API_URLS = [
  "http://localhost:8081/api/assessment",
  "http://localhost:3001/api/assessment"
];

export function useExcelAssessment() {
  const assessmentRules: StandardCellRule[] = [
    {
      row: 6,
      col: 2,
      cellRef: "C7",
      title: "季度销售总额求和 (SUM)",
      scoreWeight: 30,
      standardValue: 158000,
      standardFormula: "=SUM(C3:C6)",
      errorAnalysisPrompt: "求和范围选择错误或未引用正确的季度数据单元格(C3:C6)。"
    },
    {
      row: 7,
      col: 2,
      cellRef: "C8",
      title: "月度平均销售额 (AVERAGE)",
      scoreWeight: 20,
      standardValue: 39500,
      standardFormula: "=AVERAGE(C3:C6)",
      errorAnalysisPrompt: "平均值函数公式应为 =AVERAGE(C3:C6)，请检查分母或单元格区间。"
    },
    {
      row: 8,
      col: 2,
      cellRef: "C9",
      title: "应缴增值税率计算 (13%)",
      scoreWeight: 25,
      standardValue: 20540,
      standardFormula: "=C7*0.13",
      errorAnalysisPrompt: "税率计算应用总额 C7 乘以 0.13，请勿硬编码固定数值。"
    },
    {
      row: 9,
      col: 2,
      cellRef: "C10",
      title: "税后净利润占比分析",
      scoreWeight: 25,
      standardValue: "达标",
      standardFormula: '=IF(C7>100000,"达标","未达标")',
      errorAnalysisPrompt: "逻辑判断函数应使用 IF 判断总额 C7 是否大于 100000。"
    }
  ];

  const initialSheetData = [
    {
      id: "assessment-sheet",
      name: "财务季度考核表",
      status: 1,
      order: 0,
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
      ]
    }
  ];

  const sampleErrorCelldata = [
    { r: 6, c: 2, v: { f: "=SUM(C3:C5)", v: 115000, m: "115000" } }, // 求和范围偏小错误
    { r: 7, c: 2, v: { v: 39500, m: "39500" } },                   // 未输入公式(硬编码数字)错误
    { r: 8, c: 2, v: { f: "=C7*0.13", v: 14950, m: "14950" } },       // 基于错误C7计算
    { r: 9, c: 2, v: { f: '=IF(C7>100000,"未达标","达标")', v: "未达标", m: "未达标" } } // 逻辑颠倒错误
  ];

  const sampleCorrectCelldata = [
    { r: 6, c: 2, v: { f: "=SUM(C3:C6)", v: 158000, m: "158000" } },
    { r: 7, c: 2, v: { f: "=AVERAGE(C3:C6)", v: 39500, m: "39500" } },
    { r: 8, c: 2, v: { f: "=C7*0.13", v: 20540, m: "20540" } },
    { r: 9, c: 2, v: { f: '=IF(C7>100000,"达标","未达标")', v: "达标", m: "达标" } }
  ];

  const isAssessed = ref(false);
  const isFilterYellowMode = ref(false);
  const totalScore = ref(0);
  const maxPossibleScore = ref(100);
  const assessmentResults = ref<CellAssessmentItem[]>([]);
  const selectedCellFeedback = ref<CellAssessmentItem | null>(null);
  const isBackendConnected = ref(true);
  const dbSubmissionId = ref("");

  const normalizeFormula = (fmt?: string) => {
    if (!fmt) return "";
    return fmt.replace(/\s+/g, "").toUpperCase();
  };

  // 前端兜底算分引擎
  const fallbackLocalAssessment = (currentCelldata: any[]) => {
    let earned = 0;
    const results: CellAssessmentItem[] = [];
    const cellMap = new Map<string, any>();
    (currentCelldata || []).forEach((item) => {
      if (item && typeof item.r === "number" && typeof item.c === "number") {
        cellMap.set(`${item.r}_${item.c}`, item);
      }
    });

    assessmentRules.forEach((rule) => {
      const cell = cellMap.get(`${rule.row}_${rule.col}`);
      const studentVal = cell?.v?.v ?? cell?.v?.m ?? "";
      const studentFmt = cell?.v?.f ?? "";

      let isCorrect = false;
      let errorType: CellAssessmentItem['errorType'] = 'NONE';

      if (rule.standardFormula) {
        if (!studentFmt) {
          errorType = 'MISSING_FORMULA';
          isCorrect = false;
        } else {
          const normStudent = normalizeFormula(studentFmt);
          const normStandard = normalizeFormula(rule.standardFormula);
          if (normStudent === normStandard) {
            isCorrect = true;
          } else {
            errorType = 'FORMULA_MISMATCH';
            isCorrect = false;
          }
        }
      } else {
        if (typeof rule.standardValue === "number") {
          const numVal = Number(studentVal);
          if (!isNaN(numVal) && Math.abs(numVal - rule.standardValue) < 0.001) {
            isCorrect = true;
          } else {
            errorType = 'VALUE_MISMATCH';
            isCorrect = false;
          }
        } else {
          if (String(studentVal).trim() === String(rule.standardValue).trim()) {
            isCorrect = true;
          } else {
            errorType = 'VALUE_MISMATCH';
            isCorrect = false;
          }
        }
      }

      const itemScore = isCorrect ? rule.scoreWeight : 0;
      earned += itemScore;

      results.push({
        row: rule.row,
        col: rule.col,
        cellRef: rule.cellRef,
        title: rule.title,
        scoreWeight: rule.scoreWeight,
        earnedScore: itemScore,
        isCorrect,
        studentValue: studentVal,
        studentFormula: studentFmt,
        standardValue: rule.standardValue,
        standardFormula: rule.standardFormula,
        errorType: isCorrect ? 'NONE' : errorType,
        errorAnalysisPrompt: rule.errorAnalysisPrompt,
        status: isCorrect ? 'CORRECT' : 'RED_ERROR'
      });
    });

    return { totalScore: earned, results };
  };

  // 请求后端 REST API 进行评测与数据库存储 (适配 Spring Boot & Node)
  const executeAssessment = async (currentCelldata: any[], studentName: string = "张同学") => {
    let success = false;

    for (const url of BACKEND_API_URLS) {
      try {
        const response = await fetch(`${url}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentName, celldata: currentCelldata })
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.code === 200) {
            totalScore.value = resData.data.totalScore;
            assessmentResults.value = resData.data.results;
            dbSubmissionId.value = resData.data.submissionId;
            isBackendConnected.value = true;
            success = true;
            console.log(`[Spring Boot DB Success] Connected to ${url}, Record saved:`, resData.data.submissionId);
            break;
          }
        }
      } catch (err) {
        // 继续尝试下一个后端地址
      }
    }

    if (!success) {
      console.warn("[Spring Boot Backend Offline] Falling back to local engine");
      isBackendConnected.value = false;
      const { totalScore: earned, results } = fallbackLocalAssessment(currentCelldata);
      totalScore.value = earned;
      assessmentResults.value = results;
    }

    isAssessed.value = true;
    isFilterYellowMode.value = false;

    const firstError = assessmentResults.value.find((r) => !r.isCorrect);
    if (firstError) {
      selectedCellFeedback.value = firstError;
    }

    return assessmentResults.value;
  };

  const generateGradedSheetData = (baseSheet: any[]) => {
    if (!isAssessed.value || !baseSheet?.[0]) return baseSheet;

    const cloned = JSON.parse(JSON.stringify(baseSheet));
    const sheet = cloned[0];
    sheet.celldata = sheet.celldata || [];

    assessmentResults.value.forEach((res) => {
      let bg: string | undefined = undefined;
      let fc: string | undefined = undefined;

      const isSelected = selectedCellFeedback.value && selectedCellFeedback.value.cellRef === res.cellRef;

      if (!res.isCorrect) {
        if (isFilterYellowMode.value || isSelected) {
          bg = "#FFF1B8";
          fc = "#D48806";
          res.status = 'YELLOW_ANALYZED';
        } else {
          bg = "#FFD2D2";
          fc = "#CF1322";
          res.status = 'RED_ERROR';
        }
      } else {
        // 点击/选中正确答案时，左侧对应的单元格渲染为柔和绿色 (#D9F7BE) 字体绿色 (#237804)
        if (isSelected) {
          bg = "#D9F7BE";
          fc = "#237804";
        }
      }

      let cellItem = sheet.celldata.find((c: any) => c.r === res.row && c.c === res.col);
      if (!cellItem) {
        cellItem = { r: res.row, c: res.col, v: { v: res.studentValue, f: res.studentFormula } };
        sheet.celldata.push(cellItem);
      }
      cellItem.v = cellItem.v || {};

      if (bg) {
        cellItem.v.bg = bg;
        cellItem.v.fc = fc;
      } else {
        delete cellItem.v.bg;
        delete cellItem.v.fc;
      }

      if (Array.isArray(sheet.data) && sheet.data[res.row]) {
        sheet.data[res.row][res.col] = sheet.data[res.row][res.col] || {};
        if (bg) {
          sheet.data[res.row][res.col].bg = bg;
          sheet.data[res.row][res.col].fc = fc;
        } else {
          delete sheet.data[res.row][res.col].bg;
          delete sheet.data[res.row][res.col].fc;
        }
      }
    });

    return cloned;
  };

  const selectErrorCellForAnalysis = (item: CellAssessmentItem) => {
    selectedCellFeedback.value = item;
  };

  const toggleFilterYellowMode = () => {
    isFilterYellowMode.value = !isFilterYellowMode.value;
  };

  const getCleanInitialSheetData = () => {
    const cloned = JSON.parse(JSON.stringify(initialSheetData));
    const sheet = cloned[0];
    if (sheet) {
      delete sheet.data; // 擦除之前的二维矩阵缓存，防止残留旧单元格样式或背景高亮
      const targetCoords = [
        { r: 6, c: 2 },
        { r: 7, c: 2 },
        { r: 8, c: 2 },
        { r: 9, c: 2 }
      ];
      sheet.celldata = sheet.celldata || [];
      targetCoords.forEach(({ r, c }) => {
        const idx = sheet.celldata.findIndex((item: any) => item.r === r && item.c === c);
        const cleanCell = {
          r,
          c,
          v: { v: "", m: "" }
        };
        if (idx >= 0) {
          sheet.celldata[idx] = cleanCell;
        } else {
          sheet.celldata.push(cleanCell);
        }
      });
    }
    return cloned;
  };

  const resetAssessment = () => {
    isAssessed.value = false;
    isFilterYellowMode.value = false;
    totalScore.value = 0;
    assessmentResults.value = [];
    selectedCellFeedback.value = null;
    dbSubmissionId.value = "";
  };

  const errorCount = computed(() => assessmentResults.value.filter((r) => !r.isCorrect).length);
  const correctCount = computed(() => assessmentResults.value.filter((r) => r.isCorrect).length);

  return {
    assessmentRules,
    initialSheetData,
    getCleanInitialSheetData,
    isAssessed,
    isFilterYellowMode,
    totalScore,
    maxPossibleScore,
    assessmentResults,
    selectedCellFeedback,
    isBackendConnected,
    dbSubmissionId,
    errorCount,
    correctCount,
    executeAssessment,
    generateGradedSheetData,
    selectErrorCellForAnalysis,
    toggleFilterYellowMode,
    resetAssessment,
    sampleErrorCelldata,
    sampleCorrectCelldata
  };
}
