import { DEFAULT_TURN_SPEED } from "./consts.js"
import { Game, Minimap, PlayerEntity, Scene, Vector2 } from "./game.js"
import { assert, loadImage } from "./utils.js"

const [tsodinPog, tsodinFlushed, tsodinZezin, tsodinGasm, tf, typescript] = await Promise.all([
    loadImage("images/tsodinEmotes/tsodinPog.png"),
    loadImage("images/tsodinEmotes/tsodinFlushed.png"),
    loadImage("images/tsodinEmotes/tsodinZezin.png"),
    loadImage("images/tsodinEmotes/tsodinGasm.png"),
    loadImage("images/tf.png"),
    loadImage("images/Typescript_logo_2020.png"),
])

const scene = Scene([
    [null, null, tf, typescript, null, null, null, null, null],
    [null, null, null, tsodinZezin, null, null, null, null, null],
    [null, tsodinGasm, tsodinFlushed, tsodinPog, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
])
const canvas = document.getElementById("game") as HTMLCanvasElement | null
assert(canvas !== null, "Canvas element not found")
const player = PlayerEntity(Vector2.zero(), Math.PI * 1.25)
const game = Game(canvas, scene, player, Minimap(Vector2.zero(), Vector2.zero()))
// Init player position in the middle of the scene
player.position = game.scene.size().multiply(Vector2(0.63, 0.63))
// Init minimap position and size
game.minimap.position = Vector2.zero().add(game.canvasSize().scale(0.02))
game.minimap.size = game.scene.size().scale(game.canvas.width * 0.03)

window.addEventListener("keydown", (e) => {
    //prettier-ignore
    switch (e.code) {
            case "KeyW": player.movingForward  = true; break
            case "KeyS": player.movingBackward = true; break
            case "KeyA": player.turningLeft    = true; break
            case "KeyD": player.turningRight   = true; break
        }
})
window.addEventListener("keyup", (e) => {
    //prettier-ignore
    switch (e.code) {
            case "KeyW": player.movingForward  = false; break
            case "KeyS": player.movingBackward = false; break
            case "KeyA": player.turningLeft    = false; break
            case "KeyD": player.turningRight   = false; break
        }
})

let prevTimestamp = 0
const frame = (timestamp: number) => {
    const dt = (timestamp - prevTimestamp) / 1000
    prevTimestamp = timestamp
    let velocity = Vector2.zero()
    let angularVelocity = 0

    if (player.movingForward) {
        velocity = velocity.add(Vector2.fromAngle(player.direction).scale(player.movespeed))
    }
    if (player.movingBackward) {
        velocity = velocity.subtract(Vector2.fromAngle(player.direction).scale(player.movespeed))
    }
    if (player.turningLeft) {
        angularVelocity -= DEFAULT_TURN_SPEED
    }
    if (player.turningRight) {
        angularVelocity += DEFAULT_TURN_SPEED
    }

    player.direction = player.direction + angularVelocity * dt
    player.position = player.position.add(velocity.scale(dt))
    game.render()
    requestAnimationFrame(frame)
}

requestAnimationFrame((timestamp) => {
    prevTimestamp = timestamp
    frame(timestamp)
})
