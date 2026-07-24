# Socket.IO Collaboration Implementation Plan

**Goal:** Use a Node Socket.IO gateway as the authoritative collaboration service for FortuneSheet.

**Architecture:** Spring Boot issues JWTs and serves assessment APIs. The Node gateway validates the JWT, serializes operations per room, assigns revisions, broadcasts through Socket.IO, stores snapshots and operation logs in MongoDB, and uses the Redis adapter for multi-instance messaging.

**Conflict policy:** Clients do not edit offline. Operations are applied in server arrival order; concurrent writes to the same cell use last-write-wins. Reconnecting clients replace local state with the latest server snapshot.

**Services:**

- Vite frontend: `http://127.0.0.1:5000`
- Spring business API: `http://127.0.0.1:8081`
- Socket.IO gateway: `http://127.0.0.1:8082`
- MongoDB: `localhost:27017/fortune_sheet_collab`
- Redis: `localhost:6379`, database 8

**Verification:**

- Node protocol and room-ordering tests
- Vue type-check and production build
- Spring clean test and package
- Socket.IO join, ACK, revision, broadcast, snapshot recovery, and last-write-wins checks
- Two-browser FortuneSheet cell synchronization
