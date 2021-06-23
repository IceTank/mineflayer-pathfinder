const mineflayer = require('mineflayer')
const { pathfinder, Movements } = require('../index')
const { GoalNear, GoalBlock, GoalXZ, GoalY, GoalInvert, GoalFollow, GoalPlaceBlock } = require('../index').goals
const EdgeMovement = require('../customMovement/edgeMovement/block-edge-movement')
const { pointer } = require('mineflayer-pointer')
const { Vec3 } = require('vec3')

if (process.argv.length > 6) {
  console.log('Usage : node example.js [<host>] [<port>] [<name>] [<password>]')
  process.exit(1)
}

const bot = mineflayer.createBot({
  host: process.argv[2] || 'localhost',
  port: parseInt(process.argv[3]) || 25565,
  username: process.argv[4] || 'pathfinder',
  password: process.argv[5]
})

bot.once('spawn', () => {
  bot.loadPlugins([pathfinder, pointer])
    
  // Once we've spawn, it is safe to access mcData because we know the version
  const mcData = require('minecraft-data')(bot.version)

  // We create different movement generators for different type of activity
  const edgeMove = new EdgeMovement(bot, mcData)
  const defaultMove = new Movements(bot, mcData)

  console.info('Joined the server')

  bot.on('goal_reached', (goal) => {
    console.log('gaol_reached event')
  })

  bot.on('path_reset', (reason) => {
    console.log(`Path was reset for reason: ${reason}`)
  })

  bot.on('chat', async (username, message) => {
    if (username === bot.username) return

    const target = bot.players[username] ? bot.players[username].entity : null
    if (message === 'come') {
      if (!target) {
        bot.chat('I don\'t see you !')
        return
      }
      const p = target.position

      bot.pathfinder.setMovements(defaultMove)
      bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1))
    } else if (message.startsWith('goto')) {
      const cmd = message.split(' ')

      if (cmd.length === 4) { // goto x y z
        const x = parseInt(cmd[1], 10)
        const y = parseInt(cmd[2], 10)
        const z = parseInt(cmd[3], 10)

        bot.pathfinder.setMovements(defaultMove)
        bot.pathfinder.setGoal(new GoalBlock(x, y, z))
      } else if (cmd.length === 3) { // goto x z
        const x = parseInt(cmd[1], 10)
        const z = parseInt(cmd[2], 10)

        bot.pathfinder.setMovements(defaultMove)
        bot.pathfinder.setGoal(new GoalXZ(x, z))
      } else if (cmd.length === 2) { // goto y
        const y = parseInt(cmd[1], 10)

        bot.pathfinder.setMovements(defaultMove)
        bot.pathfinder.setGoal(new GoalY(y))
      }
    } else if (message === 'here') {
      bot.pathfinder.setMovements(edgeMove)
      if (!target) {
        bot.chat('I don\'t see you !')
        return
      }
      const p = target.position.floored()

      const goal = new GoalPlaceBlock(new Vec3(p.x, p.y, p.z), bot.world)
      await bot.pathfinder.goto(goal)
      const referenceBlock = bot.findBlock({
        matching: (block) => {
          block.boundingBox === 'block'
        }
      })
      if (!referenceBlock) {
        bot.chat('Cannot find ref block')
        return
      }
      bot.placeBlock(referenceBlock, p, (err) => {
        if (err) {
          console.error(err)
          return bot.chat('Block place error')
        }
        bot.chat('Placed cube in block game')
      })
    } else if (message === 'follow') {
      bot.pathfinder.setMovements(defaultMove)
      bot.pathfinder.setGoal(new GoalFollow(target, 3), true)
      // follow is a dynamic goal: setGoal(goal, dynamic=true)
      // when reached, the goal will stay active and will not
      // emit an event
    } else if (message === 'avoid') {
      bot.pathfinder.setMovements(defaultMove)
      bot.pathfinder.setGoal(new GoalInvert(new GoalFollow(target, 5)), true)
    } else if (message === 'stop') {
      bot.pathfinder.setGoal(null)
    }
  })

  const rayTraceEntitySight = function (options) {
    if (bot.world?.raycast) {
      const { height, position, yaw, pitch } = options.entity
      const x = -Math.sin(yaw) * Math.cos(pitch)
      const y = Math.sin(pitch)
      const z = -Math.cos(yaw) * Math.cos(pitch)
      const rayBlock = bot.world.raycast(position.offset(0, height, 0), new Vec3(x, y, z), 120)
      if (rayBlock) {
        return rayBlock
      }
    } else {
      throw Error('bot.world.raycast does not exists. Try updating prismarine-world.')
    }
  }

  bot._client.on('packet', async (data, meta) => {
    if (meta.name !== 'animation') return
    if (data.animation !== 0) return
    const entity = bot.entities[data.entityId]
    if (!entity || entity.type !== 'player') return
    if (!entity.heldItem || entity.heldItem.name !== 'wooden_axe') return
    const rayBlock = rayTraceEntitySight({ entity })
    if (!rayBlock) {
      return bot.chat('Block out of Sight')
    }
    const dir = directionToVector (rayBlock.face)
    const targetBlock = bot.blockAt(rayBlock.position.offset(dir.x, dir.y, dir.z))
    if (!targetBlock) {
      return bot.chat('Errr something is wrong')
    }
    try { 
      bot.pathfinder.setMovements(edgeMove)
      await bot.pathfinder.goto(new GoalPlaceBlock(targetBlock.position, bot.world))
      await bot.equip(bot.inventory.items().find(i => i.name === 'obsidian'), 'hand')
      await bot.placeBlock(rayBlock, dir)
      
      bot.chat('Wup wup did it')
    } catch (e) {
      console.error('Upssy wuppsy I did a uppsy owo', e)
    } finally {
      bot.pathfinder.setMovements(defaultMove)
    }
  })
})

function directionToVector (dir) {
  if (dir > 5 || dir < 0) return null
  if (dir === 0) {
    return new Vec3(0, -1, 0)
  } else if (dir === 1) {
    return new Vec3(0, 1, 0)
  } else if (dir === 2) {
    return new Vec3(0, 0, -1)
  } else if (dir === 3) {
    return new Vec3(0, 0, 1)
  } else if (dir === 4) {
    return new Vec3(-1, 0, 0)
  } else if (dir === 5) {
    return new Vec3(1, 0, 0)
  }
}
