<script setup lang="ts">
import { computed } from "vue";
import type { CellAssessmentItem } from "../composables/useExcelAssessment";

const props = defineProps<{
  feedbackData: CellAssessmentItem | null;
  isYellowMode: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const getErrorTypeName = (type?: CellAssessmentItem['errorType']) => {
  switch (type) {
    case "MISSING_FORMULA":
      return "缺失必要函数公式";
    case "FORMULA_MISMATCH":
      return "函数公式语法/区间范围错误";
    case "VALUE_MISMATCH":
      return "计算结果数值/文本不匹配";
    default:
      return "答题异常";
  }
};
</script>

<template>
  <div v-if="feedbackData" class="feedback-card" :class="{ 'is-yellow': isYellowMode || feedbackData.status === 'YELLOW_ANALYZED' }">
    <div class="feedback-header">
      <div class="title-group">
        <span class="cell-tag">{{ feedbackData.cellRef }}</span>
        <span class="title-text">{{ feedbackData.title }}</span>
      </div>
      <div class="score-status">
        <span class="score-badge" :class="feedbackData.isCorrect ? 'correct' : 'error'">
          {{ feedbackData.earnedScore }} / {{ feedbackData.scoreWeight }} 分
        </span>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>
    </div>

    <div class="feedback-body">
      <!-- 错误类型警告带 -->
      <div v-if="!feedbackData.isCorrect" class="error-banner">
        <span class="warning-icon">⚠️</span>
        <span class="error-type-text">{{ getErrorTypeName(feedbackData.errorType) }}</span>
      </div>

      <!-- 对比分析表格 -->
      <div class="comparison-grid">
        <div class="grid-column student">
          <div class="column-header">学生提交</div>
          <div class="field-item">
            <span class="field-label">计算数值:</span>
            <span class="field-value highlight">{{ feedbackData.studentValue !== '' ? feedbackData.studentValue : '(空)' }}</span>
          </div>
          <div class="field-item">
            <span class="field-label">输入公式:</span>
            <code class="formula-code student">{{ feedbackData.studentFormula || '无公式 (硬编码)' }}</code>
          </div>
        </div>

        <div class="grid-column standard">
          <div class="column-header">标准答案</div>
          <div class="field-item">
            <span class="field-label">标准数值:</span>
            <span class="field-value standard-highlight">{{ feedbackData.standardValue }}</span>
          </div>
          <div class="field-item">
            <span class="field-label">标准公式:</span>
            <code class="formula-code standard">{{ feedbackData.standardFormula || '无公式要求' }}</code>
          </div>
        </div>
      </div>

      <!-- 定点错误分析提示 -->
      <div v-if="!feedbackData.isCorrect" class="analysis-box">
        <div class="analysis-title">🔍 定点诊断与错误原因提示：</div>
        <p class="analysis-text">{{ feedbackData.errorAnalysisPrompt }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feedback-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #ffccc7;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.feedback-card.is-yellow {
  border-color: #ffe58f;
  box-shadow: 0 6px 24px rgba(250, 173, 20, 0.2);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #fff2f0;
  border-bottom: 1px solid #ffccc7;
}

.is-yellow .feedback-header {
  background: #fffbe6;
  border-bottom-color: #ffe58f;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cell-tag {
  background: #ff4d4f;
  color: #fff;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.is-yellow .cell-tag {
  background: #faad14;
  color: #fff;
}

.title-text {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
}

.score-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
}

.score-badge.error {
  background: #fff1f0;
  color: #cf1322;
  border: 1px solid #ffa39e;
}

.score-badge.correct {
  background: #f6ffed;
  color: #389e0d;
  border: 1px solid #b7eb8f;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 14px;
  color: #8c8c8c;
  cursor: pointer;
  padding: 0 4px;
}

.close-btn:hover {
  color: #1f2937;
}

.feedback-body {
  padding: 12px 14px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff2f0;
  color: #cf1322;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 10px;
}

.is-yellow .error-banner {
  background: #fffbe6;
  color: #d48806;
}

.error-type-text {
  font-weight: 600;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.grid-column {
  background: #fafafa;
  border-radius: 6px;
  padding: 8px;
  border: 1px solid #f0f0f0;
}

.column-header {
  font-size: 12px;
  font-weight: 700;
  color: #595959;
  margin-bottom: 6px;
  border-bottom: 1px dashed #d9d9d9;
  padding-bottom: 4px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
}

.field-label {
  font-size: 11px;
  color: #8c8c8c;
}

.field-value {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
}

.field-value.highlight {
  color: #cf1322;
}

.field-value.standard-highlight {
  color: #389e0d;
}

.formula-code {
  font-family: monospace;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  word-break: break-all;
}

.formula-code.student {
  background: #fff1f0;
  color: #a8071a;
  border: 1px solid #ffa39e;
}

.formula-code.standard {
  background: #f6ffed;
  color: #237804;
  border: 1px solid #b7eb8f;
}

.analysis-box {
  background: #f5f5f5;
  border-left: 3px solid #faad14;
  padding: 8px 10px;
  border-radius: 0 4px 4px 0;
}

.analysis-title {
  font-size: 12px;
  font-weight: 700;
  color: #d48806;
  margin-bottom: 2px;
}

.analysis-text {
  margin: 0;
  font-size: 12px;
  color: #434343;
  line-height: 1.4;
}
</style>
