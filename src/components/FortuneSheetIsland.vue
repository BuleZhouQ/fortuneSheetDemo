<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const emit = defineEmits<{ op: [unknown]; state: [unknown[]] }>();
const frame = ref<HTMLIFrameElement>();
const ready = ref(false);
let pendingPayload: any;

const onMessage = (event: MessageEvent) => {
  if (event.source !== frame.value?.contentWindow) return;
  if (event.data?.type === "fortune-op") emit("op", event.data);
  if (event.data?.type === "fortune-state") emit("state", event.data.snapshot);
};

const applyOp = (payload: any) => {
  if (!ready.value) {
    pendingPayload = payload;
    return;
  }
  frame.value?.contentWindow?.postMessage({ type: "fortune-remote-op", op: payload?.op, snapshot: payload?.snapshot }, location.origin);
};

const onFrameLoad = () => {
  ready.value = true;
  if (pendingPayload) {
    const payload = pendingPayload;
    pendingPayload = undefined;
    applyOp(payload);
  }
};

onMounted(() => window.addEventListener("message", onMessage));
onBeforeUnmount(() => window.removeEventListener("message", onMessage));
defineExpose({ applyOp });
</script>

<template>
  <iframe ref="frame" src="/sheet.html" class="fortune-frame" title="FortuneSheet 编辑器" @load="onFrameLoad" />
</template>

<style scoped>
.fortune-frame { display: block; width: 100%; height: 100%; border: 0; }
</style>
