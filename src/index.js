import Phaser from 'phaser'

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  players: undefined,
  scene: {
    preload() {},
    create() {
      this.socket = io.connect('http://localhost:3000')
      this.players = {}
      this.player = {}
      this.keys = this.input.keyboard.addKeys('W, A, S, D')
      this.isKeyPressed = {
        W: false,
        A: false,
        S: false,
        D: false
      }

      this.socket.on('new-player', (player) => {
        if (player.id !== this.socket.id) {
          this.players[player.id] = this.add.sprite(
            player.x,
            player.y,
            'player'
          )
        } else {
          this.player = this.add.sprite(player.x, player.y, 'player')
        }
      })

      this.socket.on('game-update', (update) => {
        if (update.player.id === this.socket.id) {
          this.player.x = update.player.x
          this.player.y = update.player.y
        }

        Object.values(update.others).forEach((player) => {
          if (player.id !== this.socket.id) {
            if (this.players[player.id] == null) {
              this.players[player.id] = this.add.sprite(
                player.x,
                player.y,
                'player'
              )
            } else {
              this.players[player.id].x = player.x
              this.players[player.id].y = player.y
            }
          }
        })
      })

      this.socket.on('disconnects', (id) => {
        this.players[id].destroy()
        delete this.players[id]
      })
    },
    update() {
      const W = this.isKeyPressed.W
      const A = this.isKeyPressed.A
      const S = this.isKeyPressed.S
      const D = this.isKeyPressed.D

      if (this.keys.W.isDown) {
        this.isKeyPressed.W = true
      } else {
        this.isKeyPressed.W = false
      }

      if (this.keys.A.isDown) {
        this.isKeyPressed.A = true
      } else {
        this.isKeyPressed.A = false
      }

      if (this.keys.S.isDown) {
        this.isKeyPressed.S = true
      } else {
        this.isKeyPressed.S = false
      }

      if (this.keys.D.isDown) {
        this.isKeyPressed.D = true
      } else {
        this.isKeyPressed.D = false
      }

      if (
        this.isKeyPressed.W ||
        this.isKeyPressed.A ||
        this.isKeyPressed.S ||
        this.isKeyPressed.D
      ) {
        this.socket.emit('player-input', {
          up: this.isKeyPressed.W,
          left: this.isKeyPressed.A,
          down: this.isKeyPressed.S,
          right: this.isKeyPressed.D
        })
      }
    }
  }
}

class Game {
  constructor() {
    this.game = new Phaser.Game(config)
    this.players = {}
  }
}

export default new Game()
