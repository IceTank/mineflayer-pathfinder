const Move = require('../../lib/move')
const { Vec3 } = require('vec3')

class MoveEdge extends Move {
  /**
   * 
   * @param {number} x X
   * @param {number} y Y
   * @param {number} z Z
   * @param {number} remainingBlocks Remaining Scaffolding blocks in inventory. Usually node.remaininBlocks or variation of that
   * @param {number} cost Cost for this move
   * @param {Array} toBreak List of blocks to break. `{ x: number, y: number, z: number }`
   * @param {Array} toPlace List of blocks to place. `{ x: number, y: number, z: number, dx: number, dy: number, dz: number, jump: boolean }`
   * @param {boolean} parkour Parkour allowed or not (sprinting long jumps etc)
   * @param {Object} targetEdge The target edge to move towards
   * @param {Object} startingBlock Position of the block to start from
   */
  constructor(x, y, z, remainingBlocks, cost, toBreak = [], toPlace = [], parkour = false, targetEdge, startingBlock) {
    super(x, y, z, remainingBlocks, cost, toBreak = [], toPlace = [], parkour = false)
    this.disallowChildNodes = true
    this.targetEdge = targetEdge
    this.startingBlock = startingBlock
  }
}

module.exports = MoveEdge
