module.exports = {
  run(creep) {
    // --- State machine: harvesting vs working ---
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
    }

    // --- Harvest mode ---
    if (!creep.memory.working) {
      const source = creep.pos.findClosestByPath(FIND_SOURCES);
      if (source) {
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
          creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
        }
      }
      return;
    }

    // --- Work mode: fill spawn/extensions, else upgrade ---
    const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) =>
        (s.structureType === STRUCTURE_SPAWN ||
          s.structureType === STRUCTURE_EXTENSION) &&
        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });

    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: "#00ff00" } });
      }
      return;
    }

    // No fill targets → upgrade controller
    const ctrl = creep.room.controller;
    if (ctrl) {
      if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) {
        creep.moveTo(ctrl, { visualizePathStyle: { stroke: "#ffffff" } });
      }
    }
  }
};