module.exports = {
  update(room) {
    if (!room || !room.controller) return;

    // Update every 10 ticks to keep Memory churn low
    if (Game.time % 10 !== 0) return;

    const c = room.controller;

    Memory.dashboard = {
      v: 1,
      tick: Game.time,
      room: room.name,
      rcl: c.level,
      progress: c.progress,
      progressTotal: c.progressTotal,
      rclP: c.progressTotal > 0 ? (c.progress / c.progressTotal) : 0
    };
  }
};
