'use strict';

/*
 * squadsiege is part of a squad to attack a room
 *
 * Heals creeps
 */

roles.squadheal = {};

roles.squadheal.getPartConfig = function(room, energy, heal) {
  var parts = [MOVE, HEAL];
  return room.getPartConfig(energy, parts).sort();
};

roles.squadheal.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable - 50, 5100);
};

roles.squadheal.energyBuild = function(room, energy) {
  return Math.min(room.energyCapacityAvailable - 50, 5100);
};

roles.squadheal.preMove = function(creep, directions) {
  if (creep.hits < creep.hitsMax) {
    console.log('preMove heal');
    creep.heal(creep);
    creep.memory.routing.reverse = true;
    if (directions) {
      directions.direction = directions.backwardDirection;
    }
    return false;
  } else {
    creep.memory.routing.reverse = false;
    return false;
  }

  var myCreeps = this.room.find(FIND_MY_CREEPS, {
    filter: function(object) {
      if (object.hits < object.hitsMax) {
        return true;
      }
      return false;
    }
  });
  if (myCreeps.length > 0) {
    this.say('heal', true);
    this.moveTo(myCreeps[0]);
    let range = this.pos.getRangeTo(myCreeps[0]);
    if (range <= 1) {
      this.heal(myCreeps[0]);
    } else {
      this.rangedHeal(myCreeps[0]);
    }
    return true;
  }

  if (creep.memory.squad) {
    var squad = Memory.squads[creep.memory.squad];
    if (!creep.memory.initialized) {
      squad.heal[creep.id] = {};
      creep.memory.initialized = true;
    }
    let reverse = false;
    if (squad.action == 'move') {
      if (creep.room.name == squad.moveTarget) {
        let nextExits = creep.room.find(creep.memory.route[creep.memory.routePos].exit);
        let nextExit = nextExits[Math.floor(nextExits.length / 2)];
        let range = creep.pos.getRangeTo(nextExit.x, nextExit.y);
        if (range < 4) {
          Memory.squads[creep.memory.squad].heal[creep.id].waiting = true;
          //        if (Math.random() > 0.5 * (range - 2)) {
          //          reverse = true;
          //        }
        }
      }
    }
  }
};

// TODO need to check if it works
roles.squadheal.action = function(creep) {
  if (creep.hits < creep.hitsMax) {
    creep.log('action heal');
    creep.heal(creep);
    creep.say('exit');
    let exit = creep.pos.findClosestByRange(FIND_EXIT);
    creep.log(JSON.stringify(exit));
    creep.cancelOrder('move');
    creep.cancelOrder('moveTo');

    if (creep.pos.x === 0 || creep.pos.y === 0 || creep.pos.x == 49 || creep.pos.y == 49) {
      return true;
    }

    let search = PathFinder.search(
      creep.pos, {
        pos: exit,
        range: 0
      }, {
        roomCallback: creep.room.getAvoids(creep.room, {}, true),
        maxRooms: 1
      }
    );

    creep.log(JSON.stringify(search));
    if (search.incomplete) {
      creep.say('incomplete');
      creep.log(creep.pos.getDirectionTo(exit.x, exit.y));
      let returnCode = creep.move(creep.pos.getDirectionTo(exit.x, exit.y));
      creep.log('rc: ' + returnCode);
      return true;
    }
    let returnCode = creep.move(creep.pos.getDirectionTo(search.path[0]));
    delete creep.memory.routing.reached;
    return true;
  }

  creep.squadHeal();
  return true;
};

roles.squadheal.execute = function(creep) {
  //  creep.log('Execute!!!');
};
