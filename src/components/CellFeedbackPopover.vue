<script setup lang="ts">
import type { CellAssessmentItem } from "../composables/useExcelAssessment";

const props = defineProps<{
  feedbackData: CellAssessmentItem | null;
  isYellowMode?: boolean;
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
  <div 
    v-if="feedbackData" 
    class="feedback-detail-panel" 
    :class="{ 
      'is-correct': feedbackData.isCorrect,
      'is-yellow': !feedbackData.isCorrect && (isYellowMode || feedbackData.status === 'YELLOW_ANALYZED')
    }"
    @click.stop
  >
    <div class="feedback-body">
      <!-- 仅错题展示错误类型警告带 -->
      <div v-if="!feedbackData.isCorrect" class="status-banner error-banner">
        <span class="status-icon">⚠️</span>
        <span class="status-text">{{ getErrorTypeName(feedbackData.errorType) }}</span>
      </div>

      <!-- 对比分析表格 -->
      <div class="comparison-grid">
        <div class="grid-column student" :class="{ 'is-correct': feedbackData.isCorrect }">
          <div class="column-header">学生提交</div>
          <div class="field-item">
            <span class="field-label">计算数值:</span>
            <span class="field-value" :class="feedbackData.isCorrect ? 'correct-highlight' : 'error-highlight'">
              {{ feedbackData.studentValue !== '' ? feedbackData.studentValue : '(空)' }}
            </span>
          </div>
          <div class="field-item">
            <span class="field-label">输入公式:</span>
            <code class="formula-code" :class="feedbackData.isCorrect ? 'correct-code' : 'error-code'">
              {{ feedbackData.studentFormula || '无公式 (硬编码)' }}
            </code>
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
            <code class="formula-code standard-code">{{ feedbackData.standardFormula || '无公式要求' }}</code>
          </div>
        </div>
      </div>

      <!-- 仅错题展示定点错误分析提示 -->
      <div v-if="!feedbackData.isCorrect" class="analysis-box error-box">
        <div class="analysis-title">🔍 定点诊断与错误原因提示：</div>
        <p class="analysis-text">{{ feedbackData.errorAnalysisPrompt }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feedback-detail-panel {
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #ffccc7;
  overflow: hidden;
  margin-top: 8px;
  transition: all 0.2s ease;
}

.feedback-detail-panel.is-correct {
  border-color: #b7eb8f;
  background: #fafcf7;
}

.feedback-detail-panel.is-yellow {
  border-color: #ffe58f;
  background: #fffdf5;
}

.feedback-body {
  padding: 8px 10px;
}

.status-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  margin-bottom: 6px;
}

.status-banner.error-banner {
  background: #fff2f0;
  color: #cf1322;
  border: 1px solid #ffa39e;
}

.is-yellow .status-banner.error-banner {
  background: #fffbe6;
  color: #d48806;
  border-color: #ffe58f;
}

.status-text {
  font-weight: 600;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.grid-column {
  background: #fafafa;
  border-radius: 4px;
  padding: 6px;
  border: 1px solid #f0f0f0;
}

.grid-column.is-correct {
  background: #f6ffed;
  border-color: #d9f7be;
}

.column-header {
  font-size: 11px;
  font-weight: 700;
  color: #595959;
  margin-bottom: 4px;
  border-bottom: 1px dashed #d9d9d9;
  padding-bottom: 2px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-bottom: 4px;
}

.field-label {
  font-size: 10px;
  color: #8c8c8c;
}

.field-value {
  font-size: 12px;
  font-weight: 600;
  color: #262626;
}

.error-highlight {
  color: #cf1322;
}

.correct-highlight {
  color: #278211;
}

.standard-highlight {
  color: #278211;
}

.formula-code {
  font-family: monospace;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  word-break: break-all;
}

.error-code {
  background: #fff1f0;
  color: #a8071a;
  border: 1px solid #ffa39e;
}

.correct-code {
  background: #f6ffed;
  color: #278211;
  border: 1px solid #b7eb8f;
}

.standard-code {
  background: #f6ffed;
  color: #278211;
  border: 1px solid #b7eb8f;
}

.analysis-box {
  padding: 6px;
  border-radius: 4px;
  margin-top: 6px;
}

.analysis-box.error-box {
  background: #fffbe6;
  border-left: 3px solid #faad14;
}

.error-box .analysis-title {
  font-size: 11px;
  font-weight: 700;
  color: #d48806;
  margin-bottom: 2px;
}

.analysis-text {
  margin: 0;
  font-size: 11px;
  color: #434343;
  line-height: 1.4;
}
</style>
