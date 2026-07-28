<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import FortuneSheetIsland from "./FortuneSheetIsland.vue";
import CellFeedbackPopover from "./CellFeedbackPopover.vue";
import { useCollaboration } from "../composables/useCollaboration";
import { useExcelAssessment, type CellAssessmentItem } from "../composables/useExcelAssessment";
import type { FortuneOp } from "../types/fortune-sheet";

const editor = ref<InstanceType<typeof FortuneSheetIsland>>();
const isSidebarOpen = ref(false);

const {
  initialSheetData,
  getCleanInitialSheetData,
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
  resetAssessment,
  sampleErrorCelldata,
  sampleCorrectCelldata
} = useExcelAssessment();

const currentSheetData = ref<any[]>(getCleanInitialSheetData());
const query = new URLSearchParams(location.search);
const performanceMode = true;
const collaborationRoom = query.get("room")?.trim() || "fortune-demo";
const storedUser = sessionStorage.getItem("fortune-collaboration-user");
const collaborationUser =
  query.get("user")?.trim() ||
  storedUser ||
  `用户-${Math.random().toString(36).slice(2, 6)}`;
sessionStorage.setItem("fortune-collaboration-user", collaborationUser);

const {
  connected,
  users,
  error: collaborationError,
  connect,
  publishOperations,
} = useCollaboration({
  applyOperations: (operations) => {
    editor.value?.applyOp({ op: operations });
  },
  applySnapshot: (snapshot) => {
    currentSheetData.value = snapshot;
    editor.value?.applyOp({ snapshot });
  },
});

const collaborationStatus = computed(() => {
  if (performanceMode) return "本地 200 万单元格性能测试";
  if (collaborationError.value) return collaborationError.value;
  if (!connected.value) return "正在连接协同";
  return `${users.value.length} 人在线`;
});

const onSheetOp = (payload: any) => {
  if (payload?.snapshot) {
    currentSheetData.value = payload.snapshot;
  }
  if (Array.isArray(payload?.op)) {
    publishOperations(payload.op as FortuneOp[], payload.snapshot ?? currentSheetData.value);
  }
};

const onSheetState = (snapshot: unknown[]) => {
  currentSheetData.value = snapshot;
};

onMounted(() => {
  if (performanceMode) return;
  void connect({
    room: collaborationRoom,
    user: collaborationUser,
    initialSnapshot: currentSheetData.value,
  });
});

// 填入自定义答题数据辅助逻辑
const injectCelldata = (items: any[]) => {
  const cloned = JSON.parse(JSON.stringify(currentSheetData.value));
  const sheet = cloned[0];
  if (!sheet) return;

  sheet.celldata = sheet.celldata || [];

  items.forEach((newItem) => {
    const idx = sheet.celldata.findIndex((c: any) => c.r === newItem.r && c.c === newItem.c);
    if (idx >= 0) {
      sheet.celldata[idx] = JSON.parse(JSON.stringify(newItem));
    } else {
      sheet.celldata.push(JSON.parse(JSON.stringify(newItem)));
    }

    if (Array.isArray(sheet.data) && sheet.data[newItem.r]) {
      sheet.data[newItem.r][newItem.c] = JSON.parse(JSON.stringify(newItem.v));
    }
  });

  currentSheetData.value = cloned;
  nextTick(() => {
    editor.value?.applyOp({ snapshot: cloned });
  });
};

// 一键带入示例错题（演示用）
const handleLoadSampleError = () => {
  resetAssessment();
  injectCelldata(sampleErrorCelldata);
};

// 一键带入满分答案（演示用）
const handleLoadSampleCorrect = () => {
  resetAssessment();
  injectCelldata(sampleCorrectCelldata);
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
  if (selectedCellFeedback.value?.cellRef === item.cellRef) {
    selectedCellFeedback.value = null;
  } else {
    selectErrorCellForAnalysis(item);
  }
  const updatedSheet = generateGradedSheetData(currentSheetData.value);
  currentSheetData.value = updatedSheet;

  nextTick(() => {
    editor.value?.applyOp({ snapshot: updatedSheet });
  });
};

const handleReset = () => {
  resetAssessment();
  isSidebarOpen.value = false;
  const cleanData = getCleanInitialSheetData();
  currentSheetData.value = cleanData;
  nextTick(() => {
    editor.value?.applyOp({ snapshot: cleanData });
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
          <div
            class="collab-status-badge"
            :title="`${collaborationUser} · ${collaborationRoom}`"
          >
            <span class="collab-status-dot" :class="{ connected }"></span>
            {{ collaborationStatus }}
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

        <!-- 快捷填入示例（方便现场演示或自主做题测试） -->
        <button class="wps-btn wps-btn-ghost" @click="handleLoadSampleError" title="带入示例错题数据">
          ⚡ 填入错题
        </button>
        <button class="wps-btn wps-btn-ghost" @click="handleLoadSampleCorrect" title="带入满分正确答案">
          💯 填入满分
        </button>

        <button class="wps-btn wps-btn-primary" @click="handleGradingSubmit"> 提交
        </button>

        <button class="wps-btn wps-btn-ghost" @click="handleReset" title="清空答题区重置">
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
        <FortuneSheetIsland ref="editor" @op="onSheetOp" @state="onSheetState" />
      </main>

      <!-- WPS 风格右侧诊断面板 (Drawer) -->
      <aside class="wps-sidebar-drawer" :class="{ open: isSidebarOpen }">
        <div class="drawer-header">
          <div class="drawer-title">
            <span class="title-icon">📊</span>
            <span>智能评测与定点诊断报告</span>
          </div>
          <button class="drawer-close" @click="isSidebarOpen = false">✕</button>
        </div>

        <!-- 未提交评测时的提示 -->
        <div v-if="!isAssessed" class="drawer-empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-title">暂无评测诊断报告</div>
          <div class="empty-desc">请先在顶部工具栏点击 <strong>【提交】</strong> 按钮，系统将自动进行精准算分与错因诊断。</div>
        </div>

        <template v-else>
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
          </div>

          <div class="diagnostic-list">
            <div
              v-for="item in assessmentResults"
              :key="item.cellRef"
              class="diagnostic-card"
              :class="{
                'is-correct': item.isCorrect,
                'is-error': !item.isCorrect,
                'is-selected': selectedCellFeedback?.cellRef === item.cellRef,
                'is-yellow-mode': !item.isCorrect && (isFilterYellowMode || selectedCellFeedback?.cellRef === item.cellRef)
              }"
              @click="handleSelectErrorItem(item)"
            >
              <div class="card-top">
                <span class="cell-badge">{{ item.cellRef }}</span>
                <span class="cell-title">{{ item.title }}</span>
                <span class="score-tag" :class="item.isCorrect ? 'is-correct' : 'is-error'">{{ item.earnedScore }}/{{ item.scoreWeight }}分</span>
              </div>
              <CellFeedbackPopover 
                v-if="selectedCellFeedback?.cellRef === item.cellRef"
                :feedback-data="item" 
                :is-yellow-mode="isFilterYellowMode"
                @close="selectedCellFeedback = null"
              />
            </div>
          </div>
        </div>
        </template>
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

.collab-status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 10px;
}

.collab-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #fbbf24;
}

.collab-status-dot.connected {
  background: #86efac;
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

/* 右侧 WPS Drawer 诊断面板 (GPU 硬件加速，零重排卡顿) */
.wps-sidebar-drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 380px;
  background: #ffffff;
  border-left: 1px solid #cbd5e1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
  overflow-y: auto;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
  z-index: 20;
  transform: translateX(100%);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.wps-sidebar-drawer.open {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.drawer-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  margin-top: 10px;
}

.drawer-empty-state .empty-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.drawer-empty-state .empty-title {
  font-size: 15px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 6px;
}

.drawer-empty-state .empty-desc {
  font-size: 13px;
  line-height: 1.5;
  color: #64748b;
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
  transition: all 0.15s ease-in-out;
}

.diagnostic-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.diagnostic-card.is-selected {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.diagnostic-card.is-error {
  border-color: #fee2e2;
}

.diagnostic-card.is-error.is-selected {
  border-color: #ef4444;
}

.diagnostic-card.is-yellow-mode {
  border-color: #fef08a;
}

.diagnostic-card.is-yellow-mode.is-selected {
  border-color: #d97706;
}

.diagnostic-card.is-correct {
  border-color: #dcfce7;
}

.diagnostic-card.is-correct.is-selected {
  border-color: #16a34a;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cell-badge {
  background: #dc2626;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.is-correct .cell-badge {
  background: #16a34a;
}

.is-yellow-mode .cell-badge {
  background: #d97706;
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

.score-tag.is-correct {
  color: #16a34a;
}

.score-tag.is-error {
  color: #dc2626;
}

.is-yellow-mode .score-tag.is-error {
  color: #d97706;
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
