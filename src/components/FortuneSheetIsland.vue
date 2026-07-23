<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const emit = defineEmits<{ op: [unknown] }>();
const frame = ref<HTMLIFrameElement>();

const onMessage = (event: MessageEvent) => {
  if (event.source !== frame.value?.contentWindow) return;
  if (event.data?.type === "fortune-op") emit("op", event.data);
};

const applyOp = (payload: any) => {
  frame.value?.contentWindow?.postMessage({ type: "fortune-remote-op", op: payload?.op, snapshot: payload?.snapshot }, location.origin);
};

onMounted(() => window.addEventListener("message", onMessage));
onBeforeUnmount(() => window.removeEventListener("message", onMessage));
defineExpose({ applyOp });
</script>

<template>
  <iframe ref="frame" src="/sheet.html" class="fortune-frame" title="FortuneSheet 编辑器" />
</template>

<style scoped>
.fortune-frame { display: block; width: 100%; height: 100%; border: 0; }
</style>
