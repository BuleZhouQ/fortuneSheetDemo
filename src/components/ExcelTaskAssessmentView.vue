<script setup lang="ts">
import { ref, nextTick } from "vue";
import FortuneSheetIsland from "./FortuneSheetIsland.vue";
import CellFeedbackPopover from "./CellFeedbackPopover.vue";
import { useExcelAssessment, type CellAssessmentItem } from "../composables/useExcelAssessment";

const editor = ref<InstanceType<typeof FortuneSheetIsland>>();

const {
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
} = useExcelAssessment();

const currentSheetData = ref<any[]>(JSON.parse(JSON.stringify(initialSheetData)));

const onSheetOp = (payload: any) => {
  if (payload?.snapshot) {
    currentSheetData.value = payload.snapshot;
  }
};

// 提交在线 Excel 任务（触发后端 API 评测与数据库落盘，阶段一标红）
const handleGradingSubmit = async () => {
  const celldata = currentSheetData.value[0]?.celldata || [];
  await executeAssessment(celldata, "张同学");

  const updatedSheet = generateGradedSheetData(currentSheetData.value);
  currentSheetData.value = updatedSheet;

  nextTick(() => {
    editor.value?.applyOp({ snapshot: updatedSheet });
  });
};

// 甄别与定位分析（阶段二标黄）
const handleYellowModeToggle = () => {
  toggleFilterYellowMode();
  const updatedSheet = generateGradedSheetData(currentSheetData.value);
  currentSheetData.value = updatedSheet;

  nextTick(() => {
    editor.value?.applyOp({ snapshot: updatedSheet });
  });
};

const handleSelectErrorItem = (item: CellAssessmentItem) => {
  selectErrorCellForAnalysis(item);
  const updatedSheet = generateGradedSheetData(currentSheetData.value);
  currentSheetData.value = updatedSheet;

  nextTick(() => {
    editor.value?.applyOp({ snapshot: updatedSheet });
  });
};

const handleReset = () => {
  resetAssessment();
  currentSheetData.value = JSON.parse(JSON.stringify(initialSheetData));
  nextTick(() => {
    editor.value?.applyOp({ snapshot: currentSheetData.value });
  });
};
</script>

<template>
  <div class="assessment-workspace">
    <!-- 顶部控标功能与后端/数据库状态栏 -->
    <header class="workspace-header">
      <div class="header-brand">
        <div class="brand-badge">▲6.生产级控标展示</div>
        <h2 class="brand-title">在线 Excel 任务逐单元格精准评价与数据库持久化诊断系统</h2>
      </div>

      <div class="header-actions">
        <!-- 数据库状态指示标 -->
        <div class="db-status-pill" :class="isBackendConnected ? 'connected' : 'offline'">
          <span class="status-dot"></span>
          <span>{{ isBackendConnected ? 'DB数据库已连通' : '本地引擎' }}</span>
        </div>

        <!-- 评测得分指示 -->
        <div v-if="isAssessed" class="score-pill" :class="{ 'score-pass': totalScore >= 60, 'score-fail': totalScore < 60 }">
          <span class="score-label">总得分:</span>
          <span class="score-num">{{ totalScore }}</span>
          <span class="score-total">/ {{ maxPossibleScore }} 分</span>
        </div>

        <button 
          class="btn btn-primary"
          @click="handleGradingSubmit"
        >
          <span class="btn-icon">⚡</span> 提交任务 (服务端评测与数据库落盘)
        </button>

        <button 
          v-if="isAssessed"
          class="btn btn-warning"
          :class="{ 'active': isFilterYellowMode }"
          @click="handleYellowModeToggle"
        >
          <span class="btn-icon">🔍</span> 
          {{ isFilterYellowMode ? '已切换为黄色甄别模式' : '转换黄色甄别高亮' }}
        </button>

        <button class="btn btn-secondary" @click="handleReset">
          重置任务
        </button>
      </div>
    </header>

    <div class="workspace-main">
      <main class="sheet-container">
        <FortuneSheetIsland ref="editor" @op="onSheetOp" />
      </main>

      <aside v-if="isAssessed" class="analysis-sidebar">
        <div class="sidebar-header">
          <div>
            <h3>📊 单元格诊断报告</h3>
            <div v-if="dbSubmissionId" class="db-id-text">DB记录: {{ dbSubmissionId }}</div>
          </div>
          <div class="stats-pills">
            <span class="stat-tag success">正确: {{ correctCount }}</span>
            <span class="stat-tag error">错误: {{ errorCount }}</span>
          </div>
        </div>

        <div class="error-list-section">
          <div class="section-title">错误单元格甄别列表 (点击定位)</div>
          <div class="error-items">
            <div
              v-for="item in assessmentResults"
              :key="item.cellRef"
              class="error-item-card"
              :class="{
                'is-correct': item.isCorrect,
                'is-selected': selectedCellFeedback?.cellRef === item.cellRef,
                'is-yellow-stage': isFilterYellowMode || selectedCellFeedback?.cellRef === item.cellRef
              }"
              @click="handleSelectErrorItem(item)"
            >
              <div class="item-left">
                <span class="item-cell-ref">{{ item.cellRef }}</span>
                <span class="item-title">{{ item.title }}</span>
              </div>
              <div class="item-right">
                <span v-if="item.isCorrect" class="badge-success">✓ 正确</span>
                <span v-else class="badge-error">
                  {{ isFilterYellowMode || selectedCellFeedback?.cellRef === item.cellRef ? '🟨 已甄别' : '🟥 待排查' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="popover-container" v-if="selectedCellFeedback">
          <CellFeedbackPopover 
            :feedback-data="selectedCellFeedback" 
            :is-yellow-mode="isFilterYellowMode"
            @close="selectedCellFeedback = null"
          />
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.assessment-workspace {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8fafc;
  color: #0f172a;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  z-index: 10;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-badge {
  background: #2563eb;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.brand-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.db-status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.db-status-pill.connected {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.db-status-pill.offline {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.score-pill {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.score-pill.score-pass {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.score-pill.score-fail {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.score-num {
  font-size: 18px;
  font-weight: 800;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #2563eb;
  color: #ffffff;
}

.btn-primary:hover {
  background: #1d4ed8;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.btn-warning {
  background: #d97706;
  color: #ffffff;
}

.btn-warning:hover {
  background: #b45309;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);
}

.btn-warning.active {
  background: #ca8a04;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.workspace-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sheet-container {
  flex: 1;
  height: 100%;
  position: relative;
}

.analysis-sidebar {
  width: 380px;
  background: #ffffff;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow-y: auto;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.03);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 10px;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.db-id-text {
  font-size: 10px;
  color: #64748b;
  font-family: monospace;
}

.stats-pills {
  display: flex;
  gap: 6px;
}

.stat-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.stat-tag.success {
  background: #dcfce7;
  color: #15803d;
}

.stat-tag.error {
  background: #fee2e2;
  color: #b91c1c;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.error-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fdf2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.error-item-card.is-correct {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.error-item-card.is-selected {
  border-width: 2px;
  border-color: #ef4444;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
}

.error-item-card.is-yellow-stage {
  background: #fefce8;
  border-color: #fef08a;
}

.error-item-card.is-yellow-stage.is-selected {
  border-color: #eab308;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.2);
}

.item-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-cell-ref {
  background: #ef4444;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.is-yellow-stage .item-cell-ref {
  background: #eab308;
}

.is-correct .item-cell-ref {
  background: #22c55e;
}

.item-title {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.badge-success {
  font-size: 11px;
  color: #16a34a;
  font-weight: 700;
}

.badge-error {
  font-size: 11px;
  color: #dc2626;
  font-weight: 700;
}

.is-yellow-stage .badge-error {
  color: #ca8a04;
}

.popover-container {
  margin-top: 8px;
}
</style>
