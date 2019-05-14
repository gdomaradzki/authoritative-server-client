const socket = io.connect('http://localhost:3000')

socket.on('connect', () => {
  console.log('Connected')

  socket.on('game-update', processUpdate)
})

const player = document.getElementById('player')
const other = document.getElementById('other')
const RENDER_DELAY = 100
const gameUpdates = []
let gameStart = 0
let firstServerTimestamp = 0

const currentServerTime = () => {
  return firstServerTimestamp + (Date.now() - gameStart) - RENDER_DELAY
}

const processUpdate = (update) => {
  if (!firstServerTimestamp) {
    firstServerTimestamp = update.t
    gameStart = Date.now()
  }

  gameUpdates.push(update)

  const base = getBaseUpdate()
  if (base > 0) {
    gameUpdates.splice(0, base)
  }
}

const getBaseUpdate = () => {
  const serverTime = currentServerTime()
  for (let i = gameUpdates.length - 1; i >= 0; i--) {
    if (gameUpdates[i].t <= serverTime) {
      return i
    }
  }
  return -1
}

const getCurrentState = () => {
  if (!firstServerTimestamp) {
    return {}
  }

  const base = getBaseUpdate()
  const serverTime = currentServerTime()

  if (base < 0 || base === gameUpdates.length - 1) {
    return gameUpdates[gameUpdates.length - 1]
  } else {
    const baseUpdate = gameUpdates[base]
    const next = gameUpdates[base + 1]
    const ratio = (serverTime - baseUpdate.t) / (next.t - baseUpdate.t)

    return {
      player: interpolateObject(baseUpdate.player, next.player, ratio),
      others: baseUpdate.others
    }
  }
}

function interpolateObject(base, next, ratio) {
  if (!next) {
    return base
  }

  const interpolated = {}

  Object.keys(base).forEach((key) => {
    if (key !== 'id') {
      interpolated[key] = base[key] + (next[key] - base[key]) * ratio
    } else {
      interpolated[key] = base[key]
    }
  })

  console.log(interpolated)

  return interpolated
}

// function interpolateObject(object1, object2, ratio) {
//   if (!object2) {
//     return object1
//   }

//   const interpolated = {}
//   console.log(object1, object2, ratio)
//   Object.keys(object1).forEach((key) => {
//     interpolated[key] = object1[key] + (object2[key] - object1[key]) * ratio
//   })
//   console.log(interpolated)
//   return interpolated
// }

// function interpolateDirection(d1, d2, ratio) {
//   const absD = Math.abs(d2 - d1)
//   if (absD >= Math.PI) {
//     // The angle between the directions is large - we should rotate the other way
//     if (d1 > d2) {
//       return d1 + (d2 + 2 * Math.PI - d1) * ratio
//     } else {
//       return d1 - (d2 - 2 * Math.PI - d1) * ratio
//     }
//   } else {
//     // Normal interp
//     return d1 + (d2 - d1) * ratio
//   }
// }

const onServerUpdate = (x, y) => {
  player.style.top = `${y}px`
  player.style.left = `${x}px`
}

const render = () => {
  const { player: pl, others } = getCurrentState()

  if (!player) {
    return
  }

  if (pl != null) {
    if (pl.id === socket.id) {
      onServerUpdate(pl.x, pl.y)
    }
//   }

  // others.forEach(createAndRenderPlayer.bind(null, pl))

  if (others != null && others.length > 0) {
    others.forEach((p) => {
      if (p.id !== socket.id) {
        createAndRenderPlayer(p)
      }
    })
  }

  document.body.onkeypress = (e) => {
    if (e.keyCode == 119) {
      player.style.top = `${pl.y}px`
      socket.emit('input', { top: true })
    }

    if (e.keyCode == 115) {
      player.style.top = `${pl.y}px`
      socket.emit('input', { down: true })
    }

    if (e.keyCode == 97) {
      player.style.left = `${pl.x}px`
      socket.emit('input', { left: true })
    }

    if (e.keyCode == 100) {
      player.style.left = `${pl.x}px`
      socket.emit('input', { right: true })
    }
  }
}

const update = () => {
  setInterval(render, 1000 / 60)
}

const createAndRenderPlayer = (pl) => {
  console.log(pl.x, pl.id)
  other.style.top = `${pl.y}px`
  other.style.left = `${pl.x}px`
}

update()
