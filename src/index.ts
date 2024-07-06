import { Vector2 } from "./consts.js"
import { assert, loadImageData } from "./utils.js"

let game = await import("./game.js")

const [wall, key] = await Promise.all([
    loadImageData("assets/images/custom/wall.png"),
    loadImageData("assets/images/custom/key.png"),
])

const scene = new game.Scene([
    [null, null, wall, wall, wall, null, null],
    [null, null, null, null, null, null, null],
    [wall, null, null, null, null, null, null],
    [wall, null, null, null, null, null, null],
    [wall],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
])

const KEY_SCALE = 0.4
const KEY_Z = KEY_SCALE

const sprites = [
    {
        imageData: key,
        position: new Vector2(2.5, 1.5),
        z: KEY_Z,
        scale: KEY_SCALE,

        pdist: 0,
        t: 0,
    },
    {
        imageData: key,
        position: new Vector2(3.0, 1.5),
        z: KEY_Z,
        scale: KEY_SCALE,

        pdist: 0,
        t: 0,
    },
    {
        imageData: key,
        position: new Vector2(3.5, 1.5),
        z: KEY_Z,
        scale: KEY_SCALE,

        pdist: 0,
        t: 0,
    },
    {
        imageData: key,
        position: new Vector2(4.0, 1.5),
        z: KEY_Z,
        scale: KEY_SCALE,

        pdist: 0,
        t: 0,
    },
    {
        imageData: key,
        position: new Vector2(4.5, 1.5),
        z: KEY_Z,
        scale: KEY_SCALE,

        pdist: 0,
        t: 0,
    },
]

const canvas = document.getElementById("game") as HTMLCanvasElement | null
assert(canvas !== null, "Canvas element not found")
const display = new game.Display(canvas)
const player = new game.Player(new Vector2(), Math.PI * 1.25)
const gameState = new game.GameState(canvas, display, scene, player, sprites)
let gameRenderer = new game.GameRenderer(gameState)

const isDev = window.location.hostname === "localhost"
if (isDev) {
    const ws = new WebSocket("ws://localhost:3001")
    ws.addEventListener("message", async (event) => {
        if (event.data === "hot") {
            console.log("Hot reloading module")
            game = await import("./game.js?date=" + new Date().getTime())
            gameRenderer = new game.GameRenderer(gameState)
        } else if (event.data === "cold") {
            window.location.reload()
        }
    })
}

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
    const deltaTime = (timestamp - prevTimestamp) / 1000
    prevTimestamp = timestamp
    gameRenderer.renderGame(deltaTime)
    window.requestAnimationFrame(frame)
}

window.requestAnimationFrame((timestamp) => {
    prevTimestamp = timestamp
    window.requestAnimationFrame(frame)
})
