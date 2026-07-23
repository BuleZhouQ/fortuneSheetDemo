import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "db.json");

// 初始化数据库文件
const initDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    const initialDB = {
      assessment_papers: [
        {
          paper_id: "paper_finance_2026",
          title: "企业财务季度报表考核试卷",
          max_score: 100,
          standard_rules: [
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
          ]
        }
      ],
      student_submissions: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), "utf-8");
  }
};

initDB();

const readDB = () => {
  const content = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(content);
};

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
};

// 后端公式与评测判定引擎
const normalizeFormula = (fmt) => {
  if (!fmt) return "";
  return fmt.replace(/\s+/g, "").toUpperCase();
};

const evaluateSubmission = (rules, celldata) => {
  let earned = 0;
  const results = [];

  const cellMap = new Map();
  (celldata || []).forEach((item) => {
    if (item && typeof item.r === "number" && typeof item.c === "number") {
      cellMap.set(`${item.r}_${item.c}`, item);
    }
  });

  rules.forEach((rule) => {
    const cell = cellMap.get(`${rule.row}_${rule.col}`);
    const studentVal = cell?.v?.v ?? cell?.v?.m ?? "";
    const studentFmt = cell?.v?.f ?? "";

    let isCorrect = false;
    let errorType = "NONE";

    if (rule.standardFormula) {
      if (!studentFmt) {
        errorType = "MISSING_FORMULA";
        isCorrect = false;
      } else {
        const normStudent = normalizeFormula(studentFmt);
        const normStandard = normalizeFormula(rule.standardFormula);
        if (normStudent === normStandard) {
          isCorrect = true;
        } else {
          errorType = "FORMULA_MISMATCH";
          isCorrect = false;
        }
      }
    } else {
      if (typeof rule.standardValue === "number") {
        const numVal = Number(studentVal);
        if (!isNaN(numVal) && Math.abs(numVal - rule.standardValue) < 0.001) {
          isCorrect = true;
        } else {
          errorType = "VALUE_MISMATCH";
          isCorrect = false;
        }
      } else {
        if (String(studentVal).trim() === String(rule.standardValue).trim()) {
          isCorrect = true;
        } else {
          errorType = "VALUE_MISMATCH";
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
      errorType: isCorrect ? "NONE" : errorType,
      errorAnalysisPrompt: rule.errorAnalysisPrompt,
      status: isCorrect ? "CORRECT" : "RED_ERROR"
    });
  });

  return { totalScore: earned, results };
};

// HTTP REST Server
const PORT = 3001;

const server = http.createServer((req, res) => {
  // CORS 头支持
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // 1. 获取试卷规则 API
  if (req.method === "GET" && url.pathname === "/api/assessment/paper") {
    const db = readDB();
    const paper = db.assessment_papers[0];
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ code: 200, data: paper }));
    return;
  }

  // 2. 提交答案后端评测与数据库持久化 API
  if (req.method === "POST" && url.pathname === "/api/assessment/submit") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const { studentName, celldata } = payload;

        const db = readDB();
        const paper = db.assessment_papers[0];

        // 后端评测计算
        const { totalScore, results } = evaluateSubmission(paper.standard_rules, celldata);

        // 持久化到数据库记录表
        const submissionRecord = {
          submission_id: `sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          student_name: studentName || "考生",
          paper_id: paper.paper_id,
          total_score: totalScore,
          graded_results: results,
          submitted_at: new Date().toISOString()
        };

        db.student_submissions.unshift(submissionRecord);
        writeDB(db);

        console.log(`[DB Persistence] Saved submission: Student ${submissionRecord.student_name}, Score: ${totalScore}`);

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({
            code: 200,
            message: "后端智能评测与数据库落盘成功",
            data: {
              submissionId: submissionRecord.submission_id,
              totalScore,
              maxScore: paper.max_score,
              results
            }
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ code: 500, message: err.message }));
      }
    });
    return;
  }

  // 3. 获取历史提交数据库记录 API
  if (req.method === "GET" && url.pathname === "/api/assessment/history") {
    const db = readDB();
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ code: 200, data: db.student_submissions }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ code: 404, message: "Not Found" }));
});

server.listen(PORT, () => {
  console.log(`Excel Assessment Backend & DB Server is running on http://localhost:${PORT}`);
});
