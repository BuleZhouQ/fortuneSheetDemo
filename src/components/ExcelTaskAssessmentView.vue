<script setup lang="ts">
import { ref, nextTick } from "vue";
import FortuneSheetIsland from "./FortuneSheetIsland.vue";
import CellFeedbackPopover from "./CellFeedbackPopover.vue";
import { useExcelAssessment, type CellAssessmentItem } from "../composables/useExcelAssessment";

const editor = ref<InstanceType<typeof FortuneSheetIsland>>();
const isSidebarOpen = ref(true);

const {
  initialSheetData,
  isAssessed,
  isFilterYellowMode,
  totalScore,
  maxPossibleScore,
  assessmentResults,
  selectedCellFeedback,
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

// 提交算分 (阶段一: 标红)
const handleGradingSubmit = async () => {
  const celldata = currentSheetData.value[0]?.celldata || [];
  await executeAssessment(celldata, "张同学");

  const updatedSheet = generateGradedSheetData(currentSheetData.value);
  currentSheetData.value = updatedSheet;
  isSidebarOpen.value = true;

  nextTick(() => {
    editor.value?.applyOp({ snapshot: updatedSheet });
  });
};

// 转换黄色甄别高亮 (阶段二: 标黄)
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

// 模拟快捷全屏
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
};
</script>

<template>
  <div class="wps-office-workspace">
    <!-- WPS 经典绿主色顶部 Header -->
    <header class="wps-top-header">
      <div class="wps-brand-section">
        <div class="wps-logo-icon">
          <svg viewBox="0 0 1024 1024" width="22" height="22" fill="currentColor">
            <path d="M192 128h640a64 64 0 0 1 64 64v640a64 64 0 0 1-64 64H192a64 64 0 0 1-64-64V192a64 64 0 0 1 64-64z" fill="#107c41"/>
            <path d="M280 280h464v464H280z" fill="#ffffff" opacity="0.2"/>
            <path d="M340 380l120 280 80-160 80 160 120-280h-90l-70 170-80-160-80 160-70-170z" fill="#ffffff"/>
          </svg>
        </div>
        <div class="wps-doc-meta">
          <div class="doc-title-input" contenteditable="true" spellcheck="false">
            财务季度考核与智能诊断表.xlsx
          </div>
          <div class="doc-status-badge">
            <span class="save-status-dot"></span>已自动保存
          </div>
        </div>
      </div>



      <!-- 右上角快捷操作区 -->
      <div class="wps-header-tools">
        <!-- 评测得分状态 -->
        <div v-if="isAssessed" class="wps-score-pill" :class="totalScore >= 60 ? 'pass' : 'fail'">
          <span class="score-label">评测得分</span>
          <span class="score-val">{{ totalScore }}</span>
          <span class="score-max">/ {{ maxPossibleScore }}</span>
        </div>

        <button class="wps-btn wps-btn-primary" @click="handleGradingSubmit">
          <span class="btn-icon">⚡</span> 提交
        </button>

        <button 
          v-if="isAssessed"
          class="wps-btn wps-btn-warning"
          :class="{ active: isFilterYellowMode }"
          @click="handleYellowModeToggle"
        >
          <span class="btn-icon">🔍</span> {{ isFilterYellowMode ? '黄底甄别中' : '甄别定位(变黄)' }}
        </button>

        <button class="wps-btn wps-btn-ghost" @click="handleReset" title="重置表格">
          ↺ 重置
        </button>

        <button class="wps-btn wps-btn-ghost" @click="toggleFullScreen" title="全屏查看">
          ⛶ 全屏
        </button>

        <button 
          class="wps-btn wps-btn-icon" 
          :class="{ active: isSidebarOpen }"
          @click="isSidebarOpen = !isSidebarOpen"
          title="切换诊断侧边栏"
        >
          📋
        </button>
      </div>
    </header>

    <!-- WPS 工作区主体 -->
    <div class="wps-workspace-body">
      <!-- 表格编辑区 -->
      <main class="wps-sheet-canvas">
        <FortuneSheetIsland ref="editor" @op="onSheetOp" />
      </main>

      <!-- WPS 风格右侧诊断面板 (Drawer) -->
      <aside class="wps-sidebar-drawer" :class="{ open: isSidebarOpen && isAssessed }">
        <div class="drawer-header">
          <div class="drawer-title">
            <span class="title-icon">📊</span>
            <span>智能评测与定点诊断报告</span>
          </div>
          <button class="drawer-close" @click="isSidebarOpen = false">✕</button>
        </div>

        <!-- 分数看板卡片 -->
        <div class="drawer-summary-card">
          <div class="summary-score-box">
            <div class="big-score">{{ totalScore }}</div>
            <div class="score-sub">考核试卷满分 100 分</div>
          </div>
          <div class="summary-stats-grid">
            <div class="stat-box success">
              <span class="stat-val">{{ correctCount }}</span>
              <span class="stat-lbl">正确项</span>
            </div>
            <div class="stat-box error">
              <span class="stat-val">{{ errorCount }}</span>
              <span class="stat-lbl">错误项</span>
            </div>
          </div>
        </div>

        <!-- 错因定位分析列表 -->
        <div class="drawer-section">
          <div class="section-header">
            <span>单元格甄别与定位分析</span>
            <span class="section-tip">点击卡片定位高亮</span>
          </div>

          <div class="diagnostic-list">
            <div
              v-for="item in assessmentResults"
              :key="item.cellRef"
              class="diagnostic-card"
              :class="{
                'is-correct': item.isCorrect,
                'is-selected': selectedCellFeedback?.cellRef === item.cellRef,
                'is-yellow-mode': isFilterYellowMode || selectedCellFeedback?.cellRef === item.cellRef
              }"
              @click="handleSelectErrorItem(item)"
            >
              <div class="card-top">
                <span class="cell-badge">{{ item.cellRef }}</span>
                <span class="cell-title">{{ item.title }}</span>
                <span class="score-tag">{{ item.earnedScore }}/{{ item.scoreWeight }}分</span>
              </div>
              <div class="card-bottom">
                <span v-if="item.isCorrect" class="tag-correct">✓ 答案与公式正确</span>
                <span v-else class="tag-error">
                  {{ isFilterYellowMode || selectedCellFeedback?.cellRef === item.cellRef ? '🟨 已自动渲染为黄色高亮' : '🟥 初始标红告警' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 选中错题的定点反馈 Popover -->
        <div v-if="selectedCellFeedback" class="drawer-popover-wrapper">
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
.wps-office-workspace {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #1e293b;
}

/* WPS 经典绿色 Top Header */
.wps-top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  background: #107c41;
  color: #ffffff;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 20;
}

.wps-brand-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wps-logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.wps-doc-meta {
  display: flex;
  flex-direction: column;
}

.doc-title-input {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  outline: none;
  border-radius: 4px;
  padding: 1px 4px;
  white-space: nowrap;
}

.doc-title-input:hover, .doc-title-input:focus {
  background: rgba(255, 255, 255, 0.15);
}

.doc-status-badge {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  gap: 4px;
}

.save-status-dot {
  width: 5px;
  height: 5px;
  background: #4ade80;
  border-radius: 50%;
}



/* 右侧工具组 */
.wps-header-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wps-score-pill {
  display: flex;
  align-items: baseline;
  gap: 4px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  padding: 3px 10px;
  border-radius: 14px;
  font-size: 12px;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.wps-score-pill.pass .score-val {
  color: #4ade80;
  font-weight: 800;
  font-size: 16px;
}

.wps-score-pill.fail .score-val {
  color: #fca5a5;
  font-weight: 800;
  font-size: 16px;
}

.wps-score-pill .score-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
}

.wps-score-pill .score-max {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.wps-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wps-btn-primary {
  background: #ffffff;
  color: #107c41;
  font-weight: 700;
}

.wps-btn-primary:hover {
  background: #f8fafc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.wps-btn-warning {
  background: #f59e0b;
  color: #ffffff;
}

.wps-btn-warning:hover {
  background: #d97706;
}

.wps-btn-warning.active {
  background: #b45309;
}

.wps-btn-ghost {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.wps-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.25);
}

.wps-btn-icon {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  padding: 6px 10px;
  font-size: 13px;
}

.wps-btn-icon.active {
  background: rgba(255, 255, 255, 0.35);
}

/* 主体容器 */
.wps-workspace-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.wps-sheet-canvas {
  flex: 1;
  height: 100%;
  position: relative;
}

/* 右侧 WPS Drawer 诊断面板 */
.wps-sidebar-drawer {
  width: 380px;
  background: #ffffff;
  border-left: 1px solid #cbd5e1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
  overflow-y: auto;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.06);
  z-index: 15;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.drawer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.drawer-close {
  background: transparent;
  border: none;
  font-size: 16px;
  color: #64748b;
  cursor: pointer;
}

.drawer-summary-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
  border-radius: 8px;
  padding: 14px;
  border: 1px solid #bbf7d0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.big-score {
  font-size: 32px;
  font-weight: 900;
  color: #107c41;
  line-height: 1;
}

.score-sub {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.summary-stats-grid {
  display: flex;
  gap: 12px;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 12px;
  border-radius: 6px;
}

.stat-box.success {
  background: #ffffff;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.stat-box.error {
  background: #ffffff;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.stat-val {
  font-size: 16px;
  font-weight: 800;
}

.stat-lbl {
  font-size: 10px;
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.section-tip {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 400;
}

.diagnostic-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.diagnostic-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.diagnostic-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.diagnostic-card.is-selected {
  border-width: 2px;
  border-color: #ef4444;
}

.diagnostic-card.is-yellow-mode {
  background: #fffbeb;
  border-color: #fde047;
}

.diagnostic-card.is-yellow-mode.is-selected {
  border-color: #ca8a04;
}

.diagnostic-card.is-correct {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.cell-badge {
  background: #107c41;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.is-yellow-mode .cell-badge {
  background: #ca8a04;
}

.is-correct .cell-badge {
  background: #16a34a;
}

.cell-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
}

.score-tag {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}

.card-bottom {
  font-size: 11px;
}

.tag-correct {
  color: #16a34a;
  font-weight: 600;
}

.tag-error {
  color: #dc2626;
  font-weight: 600;
}

.is-yellow-mode .tag-error {
  color: #ca8a04;
}

.drawer-popover-wrapper {
  margin-top: 8px;
}
</style>
