<script setup lang="ts">
import type { CellAssessmentItem } from "../composables/useExcelAssessment";

defineProps<{
  feedbackData: CellAssessmentItem | null;
  isYellowMode?: boolean;
}>();
</script>

<template>
  <div v-if="feedbackData" class="feedback-detail-section" @click.stop>
    <!-- 极简对比表格 -->
    <table class="compact-diff-table">
      <thead>
        <tr>
          <th style="width: 22%;">对比项</th>
          <th style="width: 39%;">学生提交</th>
          <th style="width: 39%;">标准答案</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="col-label">计算数值</td>
          <td class="col-val" :class="feedbackData.isCorrect ? 'val-correct' : 'val-error'">
            {{ feedbackData.studentValue !== '' ? feedbackData.studentValue : '(空)' }}
          </td>
          <td class="col-val val-standard">{{ feedbackData.standardValue }}</td>
        </tr>
        <tr>
          <td class="col-label">函数公式</td>
          <td class="col-val">
            <code class="formula-tag" :class="feedbackData.isCorrect ? 'code-correct' : 'code-error'">
              {{ feedbackData.studentFormula || '无公式' }}
            </code>
          </td>
          <td class="col-val">
            <code class="formula-tag code-standard">
              {{ feedbackData.standardFormula || '无公式要求' }}
            </code>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 错因解析 Callout -->
    <div v-if="!feedbackData.isCorrect" class="analysis-callout">
      <span class="callout-label">错因解析</span>
      <p class="callout-text">{{ feedbackData.errorAnalysisPrompt }}</p>
    </div>
  </div>
</template>

<style scoped>
.feedback-detail-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

/* 优雅简洁的 3 列对比表格 */
.compact-diff-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
}

.compact-diff-table th {
  padding: 5px 6px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.compact-diff-table td {
  padding: 6px;
  vertical-align: middle;
  border-bottom: 1px solid #f1f5f9;
}

.compact-diff-table tr:last-child td {
  border-bottom: none;
}

.col-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.col-val {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  word-break: break-all;
}

.val-error {
  color: #dc2626;
}

.val-correct {
  color: #16a34a;
}

.val-standard {
  color: #16a34a;
}

.formula-tag {
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  word-break: break-all;
}

.code-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.code-correct {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.code-standard {
  background: #f8fafc;
  color: #334155;
  border: 1px solid #e2e8f0;
}

/* 错因解析 Callout */
.analysis-callout {
  margin-top: 10px;
  padding: 8px 10px;
  background: #fffbe6;
  border-left: 3px solid #d97706;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.callout-label {
  font-size: 11px;
  font-weight: 700;
  color: #b45309;
}

.callout-text {
  margin: 0;
  font-size: 12px;
  color: #451a03;
  line-height: 1.5;
}
</style>
