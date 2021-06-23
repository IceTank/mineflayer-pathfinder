const Movements = require('../../lib/movements')
const MoveEdge = require('../../customMovement/edgeMovement/moveEdge')

const cardinalDirections = [
  { x: -1, z: 0 }, // West
  { x: 1, z: 0 }, // East
  { x: 0, z: -1 }, // North
  { x: 0, z: 1 } // South
]

class EdgeMovement extends Movements {
  constructor (bot, mcData) {
    super(bot, mcData)
    this.edgeDistance = 0.6
  }

  getMoveEdgeSneak (node, dir, neighbors) {
    const blockA0 = this.getBlock(node, 0, -1, 0)
    const blockB0 = this.getBlock(node, dir.x, -1, dir.z)

    if (!blockA0.physical && blockA0.boundingBox !== 'block') return
    if (!blockB0.replaceable || blockB0.physical) return

    const blockB1 = this.getBlock(node, dir.x, 0, dir.z)
    const blockB2 = this.getBlock(node, dir.x, 1, dir.z)

    if (blockB1.physical || blockB2.physical) return

    neighbors.push(new MoveEdge(blockB1.position.x, blockB1.position.y, blockB1.position.z, node.remainingBlocks, 2, [], [], false, {
      x: dir.x,
      y: 0,
      z: dir.z
    }, {
      x: node.x, 
      y: node.y - 1, 
      z: node.z
    }))
  }

  getNeighbors (node, parentNode) {
    const parentNeighbors = super.getNeighbors(node, parentNode)
    const localNeighbors = []

    if (parentNode && parentNode.disallowChildNodes) return parentNeighbors

    for (const i in cardinalDirections) {
      const dir = cardinalDirections[i]
      this.getMoveEdgeSneak(node, dir, localNeighbors)
    }
    return parentNeighbors.concat(localNeighbors)
  }
}

module.exports = EdgeMovement
