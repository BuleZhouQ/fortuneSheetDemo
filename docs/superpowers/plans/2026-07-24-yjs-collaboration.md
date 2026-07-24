# Yjs Collaboration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add convergent, room-based FortuneSheet collaboration using Yjs while retaining the existing Spring WebSocket authentication, presence, and persistence infrastructure.

**Architecture:** The browser stores FortuneSheet patches in a Yjs `Y.Map`, keyed by workbook target path so independent cells merge and concurrent writes to the same target converge. Yjs updates are Base64-encoded and relayed by Spring; the server treats them as opaque payloads, persists the ordered update log in MongoDB, and replays it when a user joins.

**Tech Stack:** Vue 3, TypeScript, FortuneSheet, Yjs, Vitest, Spring Boot WebSocket, Kotlin, MongoDB, Redis.

---

### Task 1: Yjs workbook adapter

**Files:**
- Create: `src/collaboration/YjsWorkbook.ts`
- Create: `src/collaboration/YjsWorkbook.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] Write tests proving independent paths merge, same-path concurrent writes converge, remote updates are not echoed, and the initial snapshot is synchronized.
- [ ] Run `npm test -- --run`; expect the tests to fail before the adapter exists.
- [ ] Implement Base64 update encoding, path-key generation, local publication, remote application, and snapshot initialization.
- [ ] Run `npm test -- --run`; expect all adapter tests to pass.

### Task 2: Vue collaboration transport

**Files:**
- Rewrite: `src/composables/useCollaboration.ts`
- Modify: `src/types/fortune-sheet.ts`
- Modify: `src/components/FortuneSheetIsland.vue`
- Modify: `src/sheet-frame.tsx`
- Modify: `src/components/ExcelTaskAssessmentView.vue`

- [ ] Replace raw FortuneSheet operation broadcasting with Yjs update synchronization.
- [ ] Queue local operations until the server sync response arrives.
- [ ] Apply remote FortuneSheet patches without publishing them again.
- [ ] Report the workbook state after remote operations so assessment state remains current.
- [ ] Auto-connect using `room` and `user` URL parameters, with stable defaults.
- [ ] Render compact connection and presence status in the existing header.

### Task 3: Spring Yjs update relay and persistence

**Files:**
- Modify: `server-spring/src/main/kotlin/com/demo/collab/workbook/Models.kt`
- Modify: `server-spring/src/main/kotlin/com/demo/collab/workbook/Repositories.kt`
- Modify: `server-spring/src/main/kotlin/com/demo/collab/workbook/WorkbookService.kt`
- Modify: `server-spring/src/main/kotlin/com/demo/collab/ws/CollaborationHandler.kt`

- [ ] Add an operation kind so Yjs updates can coexist with legacy operation logs.
- [ ] Persist each validated Base64 Yjs update with a monotonically increasing revision.
- [ ] Return all Yjs updates in the room sync response.
- [ ] Broadcast `y-update` messages to other room members.
- [ ] Serialize writes per WebSocket session to prevent concurrent Tomcat send failures.

### Task 4: Verification

- [ ] Run `npm test -- --run`.
- [ ] Run `npm run build`.
- [ ] Run `mvn test` in `server-spring`.
- [ ] Start the backend dependencies, Spring server, and Vite server.
- [ ] Open two isolated browser sessions in the same room and verify cell edits converge in both directions.
- [ ] Confirm different rooms remain isolated and online-member status updates.

Git commit, branch, staging, and push steps are intentionally omitted because this task is being completed without Git write operations.
