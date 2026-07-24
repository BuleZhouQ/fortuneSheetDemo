import test from "node:test";
import assert from "node:assert/strict";
import { RoomSequencer } from "./room-sequencer.mjs";

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

test("serializes operations in the same room", async () => {
  const sequencer = new RoomSequencer();
  const events = [];

  const first = sequencer.run("room-a", async () => {
    await delay(30);
    events.push("first");
  });
  const second = sequencer.run("room-a", async () => {
    events.push("second");
  });

  await Promise.all([first, second]);

  assert.deepEqual(events, ["first", "second"]);
});

test("allows different rooms to run independently", async () => {
  const sequencer = new RoomSequencer();
  const events = [];

  const slowRoom = sequencer.run("room-a", async () => {
    await delay(40);
    events.push("room-a");
  });
  const fastRoom = sequencer.run("room-b", async () => {
    events.push("room-b");
  });

  await Promise.all([slowRoom, fastRoom]);

  assert.deepEqual(events, ["room-b", "room-a"]);
});
