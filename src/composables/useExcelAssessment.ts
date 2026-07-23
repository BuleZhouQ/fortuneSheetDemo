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

const BACKEND_API_URL = "http://localhost:3001/api/assessment";

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
      name: "财务季度考核表",
      status: 1,
      order: 0,
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
      ]
    }
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

  // 请求后端 REST API 进行评测与数据库存储
  const executeAssessment = async (currentCelldata: any[], studentName: string = "张同学") => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/submit`, {
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
          console.log("[Backend DB Success] Record saved:", resData.data.submissionId);
        } else {
          throw new Error(resData.message);
        }
      } else {
        throw new Error("Backend HTTP Error");
      }
    } catch (err) {
      console.warn("[Backend Offline] Falling back to local engine:", err);
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
    const celldata: any[] = cloned[0].celldata || [];

    const resultMap = new Map<string, CellAssessmentItem>();
    assessmentResults.value.forEach((res) => {
      resultMap.set(`${res.row}_${res.col}`, res);
    });

    celldata.forEach((cell) => {
      const key = `${cell.r}_${cell.c}`;
      const res = resultMap.get(key);
      if (res && !res.isCorrect) {
        if (isFilterYellowMode.value || (selectedCellFeedback.value && selectedCellFeedback.value.cellRef === res.cellRef)) {
          cell.v = cell.v || {};
          cell.v.bg = "#FFF1B8";
          cell.v.fc = "#D48806";
          res.status = 'YELLOW_ANALYZED';
        } else {
          cell.v = cell.v || {};
          cell.v.bg = "#FFD2D2";
          cell.v.fc = "#CF1322";
          res.status = 'RED_ERROR';
        }
      }
    });

    cloned[0].celldata = celldata;
    return cloned;
  };

  const selectErrorCellForAnalysis = (item: CellAssessmentItem) => {
    selectedCellFeedback.value = item;
  };

  const toggleFilterYellowMode = () => {
    isFilterYellowMode.value = !isFilterYellowMode.value;
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
    resetAssessment
  };
}
