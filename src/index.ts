import { PLAYER_SIZE, PLAYER_TURN_SPEED } from "./consts.js"
import { Color, Game, Minimap, PlayerEntity, Scene, Vector2 } from "./game.js"
import { assert, loadImage } from "./utils.js"

const [tsodinPog, tsodinFlushed, tsodinZezin, tsodinGasm, tf, typescript] = await Promise.all([
    loadImage("assets/images/opengameart/wezu_tex_cc_by/wall1_color.png").catch(Color.magenta),
    loadImage("assets/images/tsodinEmotes/tsodinFlushed.png").catch(Color.magenta),
    loadImage("assets/images/tsodinEmotes/tsodinZezin.png").catch(Color.magenta),
    loadImage("assets/images/tsodinEmotes/tsodinGasm.png").catch(Color.magenta),
    loadImage("assets/images/tf.png").catch(Color.magenta),
    loadImage("assets/images/Typescript_logo_2020.png").catch(Color.magenta),
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
    switch (e.code) {
        case "KeyW":
        case "ArrowUp":
            player.movingForward = true
            break
        case "KeyS":
        case "ArrowDown":
            player.movingBackward = true
            break
        case "KeyA":
            player.movingLeft = true
            break
        case "KeyD":
            player.movingRight = true
            break
        case "ArrowLeft":
            player.turningLeft = true
            break
        case "ArrowRight":
            player.turningRight = true
            break
    }
})
window.addEventListener("keyup", (e) => {
    switch (e.code) {
        case "KeyW":
        case "ArrowUp":
            player.movingForward = false
            break
        case "KeyS":
        case "ArrowDown":
            player.movingBackward = false
            break
        case "KeyA":
            player.movingLeft = false
            break
        case "KeyD":
            player.movingRight = false
            break
        case "ArrowLeft":
            player.turningLeft = false
            break
        case "ArrowRight":
            player.turningRight = false
            break
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
    if (player.movingLeft) {
        velocity = velocity.add(Vector2.fromAngle(player.direction - Math.PI / 2).scale(player.movespeed))
    }
    if (player.movingRight) {
        velocity = velocity.add(Vector2.fromAngle(player.direction + Math.PI / 2).scale(player.movespeed))
    }
    if (player.turningLeft) {
        angularVelocity -= PLAYER_TURN_SPEED
    }
    if (player.turningRight) {
        angularVelocity += PLAYER_TURN_SPEED
    }

    player.direction = player.direction + angularVelocity * dt
    const newPosition = player.position.add(velocity.scale(dt))
    if (scene.canPlayerWalkTo(newPosition)) {
        player.position = newPosition
    }
    game.render()
    requestAnimationFrame(frame)
}

requestAnimationFrame((timestamp) => {
    prevTimestamp = timestamp
    frame(timestamp)
})
