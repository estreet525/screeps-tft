const dashboard = require("dashboard");

const roleHarvester = require("roles/harvester.js");

module.exports.loop = function () {
  // --- Housekeeping (optional but nice) ---
  if (Game.time % 100 === 0) {
    for (const name in Memory.creeps) {
      if (!Game.creeps[name]) delete Memory.creeps[name];
    }
  }

  // --- Spawn logic: keep 2 basic workers alive ---
  const spawn = Object.values(Game.spawns)[0];
  if (!spawn) return;

  const workers = _.filter(Game.creeps, c => c.memory.role === "harvester");

  // You can bump this to 3 if you feel slow early on.
  const TARGET_WORKERS = 2;

  if (!spawn.spawning && workers.length < TARGET_WORKERS) {
    const name = `H${Game.time}`;
    // 300 energy: classic starter body
    const body = [WORK, CARRY, MOVE];

    const result = spawn.spawnCreep(body, name, {
      memory: { role: "harvester" }
    });

    if (result === OK) {
      console.log(`🪓 Spawning ${name} (${workers.length + 1}/${TARGET_WORKERS})`);
    } else {
      console.log(`⚠️ Spawn failed: ${result}`);
    }
  }

  // --- Run creeps ---
  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.role === "harvester") roleHarvester.run(creep);
  }

  // --- Dashboard snapshot (RCL only for now) ---
  dashboard.update(spawn.room);
};
