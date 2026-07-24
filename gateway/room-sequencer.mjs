export class RoomSequencer {
  #queues = new Map();

  run(room, task) {
    const previous = this.#queues.get(room) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(task);
    const tracked = current.finally(() => {
      if (this.#queues.get(room) === tracked) {
        this.#queues.delete(room);
      }
    });
    this.#queues.set(room, tracked);
    return tracked;
  }
}
