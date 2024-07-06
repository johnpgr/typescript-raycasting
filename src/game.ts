import {
    PLAYER_SPEED,
    EPS,
    FAR_CLIPPING_PLANE,
    PLAYER_FOV,
    NEAR_CLIPPING_PLANE,
    SCREEN_WIDTH,
    SCENE_FLOOR1,
    SCENE_FLOOR2,
    SCENE_CEILING1,
    SCENE_CEILING2,
    MINIMAP_SCALE,
    MINIMAP_PLAYER_SIZE,
    MINIMAP_SPRITES,
    SCREEN_HEIGHT,
    MINIMAP_SPRITE_SIZE,
    COS_OF_HALF_FOV,
    PLAYER_TURN_SPEED,
    Rgba,
    Vector2,
} from "./consts.js"
import { unreachable } from "./utils.js"

export interface Player {
    position: Vector2
    velocity: Vector2
    direction: number
    movingForward: boolean
    movingBackward: boolean
    movingLeft: boolean
    movingRight: boolean
    turningLeft: boolean
    turningRight: boolean

    fovRange(): [Vector2, Vector2]
}

export interface PlayerConstructor {
    new (position: Vector2, direction: number): Player
}

export const Player = function (this: Player, position: Vector2, direction: number) {
    this.position = position
    this.velocity = new Vector2()
    this.direction = direction
    this.movingForward = false
    this.movingBackward = false
    this.movingLeft = false
    this.movingRight = false
    this.turningLeft = false
    this.turningRight = false

    this.fovRange = (): [Vector2, Vector2] => {
        const l = Math.tan(PLAYER_FOV * 0.5) * NEAR_CLIPPING_PLANE
        const p = new Vector2().setAngle(this.direction, NEAR_CLIPPING_PLANE).add(this.position)
        const wing = p.clone().sub(this.position).rot90().norm().scale(l)
        const p1 = p.clone().sub(wing)
        const p2 = p.clone().add(wing)

        return [p1, p2]
    }
} as unknown as PlayerConstructor

export type Tile = Rgba | ImageData | null

export interface Scene {
    walls: Tile[]
    width: number
    height: number

    size(): Vector2
    contains(p: Vector2): boolean
    getTile(p: Vector2): Tile | undefined
    getFloor(p: Vector2): Tile | undefined
    getCeiling(p: Vector2): Tile | undefined
    isWall(p: Vector2): boolean
    canRectangleFitHere(px: number, py: number, sx: number, sy: number): boolean
}

export interface SceneConstructor {
    new (walls: Tile[][]): Scene
}

export const Scene = function (this: Scene, walls: Tile[][]) {
    this.height = walls.length

    for (const row of walls) {
        this.width = Math.max(this.width ?? 0, row.length)
    }

    for (let row of walls) {
        this.walls = (this.walls ?? []).concat(row)
        for (let i = 0; i < this.width - row.length; ++i) {
            this.walls.push(null)
        }
    }

    this.size = (): Vector2 => {
        return new Vector2(this.width, this.height)
    }

    this.contains = (p: Vector2): boolean => {
        return 0 <= p.x && p.x < this.width && 0 <= p.y && p.y < this.height
    }

    this.getTile = (p: Vector2): Tile | undefined => {
        if (!this.contains(p)) return undefined
        return this.walls[Math.floor(p.y) * this.width + Math.floor(p.x)]
    }

    this.getFloor = (p: Vector2): Tile | undefined => {
        if (((Math.floor(p.x) + Math.floor(p.y)) & 1) == 0) {
            return SCENE_FLOOR1
        } else {
            return SCENE_FLOOR2
        }
    }

    this.getCeiling = (p: Vector2): Tile | undefined => {
        if (((Math.floor(p.x) + Math.floor(p.y)) & 1) == 0) {
            return SCENE_CEILING1
        }
        return SCENE_CEILING2
    }

    this.isWall = (p: Vector2): boolean => {
        const c = this.getTile(p)
        return c !== undefined && c !== null
    }

    this.canRectangleFitHere = (px: number, py: number, sx: number, sy: number): boolean => {
        const x1 = Math.floor(px - sx * 0.5)
        const x2 = Math.floor(px + sx * 0.5)
        const y1 = Math.floor(py - sy * 0.5)
        const y2 = Math.floor(py + sy * 0.5)
        for (let x = x1; x <= x2; x++) {
            for (let y = y1; y <= y2; y++) {
                if (this.isWall(new Vector2(x, y))) {
                    return false
                }
            }
        }
        return true
    }
} as unknown as SceneConstructor

export interface Sprite {
    imageData: ImageData
    position: Vector2
    z: number
    scale: number
    /**
     * Player distance.
     */
    pdist: number
    /**
     * Normalized horizontal position on the screen
     */
    t: number
}

export interface SpriteConstructor {
    new (imageData: ImageData, position: Vector2, z: number, scale: number): Sprite
}

export const Sprite = function (this: Sprite, imageData: ImageData, position: Vector2, z: number, scale: number) {
    this.imageData = imageData
    this.position = position
    this.z = z
    this.scale = scale
    this.pdist = 0
    this.t = 0
} as unknown as SpriteConstructor

export interface Display {
    ctx: CanvasRenderingContext2D
    backCtx: OffscreenCanvasRenderingContext2D
    backImageData: ImageData
    zBuffer: number[]

    swapBackImageData(): void
}

export interface DisplayConstructor {
    new (canvas: HTMLCanvasElement): Display
}

export const Display = function (this: Display, canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d") ?? unreachable("2D not supported OMEGALUL")

    const backCanvas = new OffscreenCanvas(SCREEN_WIDTH, SCREEN_HEIGHT)
    this.backCtx = backCanvas.getContext("2d") ?? unreachable("2D not supported OMEGALUL")
    this.backCtx.imageSmoothingEnabled = false

    this.backImageData = new ImageData(SCREEN_WIDTH, SCREEN_HEIGHT)
    this.backImageData.data.fill(255)

    this.zBuffer = new Array(SCREEN_WIDTH).fill(0)

    this.swapBackImageData = (): void => {
        this.backCtx.putImageData(this.backImageData, 0, 0)
        this.ctx.drawImage(this.backCtx.canvas, 0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
    }
} as unknown as DisplayConstructor

export interface GameState {
    canvas: HTMLCanvasElement
    display: Display
    scene: Scene
    sprites: Sprite[]
    player: Player

    drawText(fillStyle: string, font: string, text: string, x: number, y: number): void
    drawLine(strokeStyle: string, p1: Vector2, p2: Vector2, lineWidth: number): void
    drawRect(color: string, x: number, y: number, w: number, h: number): void
    castRay(p1: Vector2, p2: Vector2): Vector2
}

export interface GameStateConstructor {
    new (canvas: HTMLCanvasElement, display: Display, scene: Scene, player: Player, sprites: Sprite[]): GameState
}

export const GameState = function (
    this: GameState,
    canvas: HTMLCanvasElement,
    display: Display,
    scene: Scene,
    player: Player,
    sprites: Sprite[],
) {
    const factor = 80

    this.canvas = canvas
    this.display = display
    this.scene = scene
    this.player = player
    this.sprites = sprites
    this.canvas.width = 16 * factor
    this.canvas.height = 9 * factor
    this.player.position = this.scene.size().mul(new Vector2(0.63, 0.63))

    this.drawText = (fillStyle: string, font: string, text: string, x: number, y: number): void => {
        this.display.ctx.fillStyle = fillStyle
        this.display.ctx.font = font
        this.display.ctx.fillText(text, x, y)
    }

    this.drawLine = (strokeStyle: string, p1: Vector2, p2: Vector2, lineWidth: number): void => {
        this.display.ctx.strokeStyle = strokeStyle
        this.display.ctx.lineWidth = lineWidth
        this.display.ctx.beginPath()
        this.display.ctx.moveTo(p1.x, p1.y)
        this.display.ctx.lineTo(p2.x, p2.y)
        this.display.ctx.stroke()
    }

    this.drawRect = (color: string, x: number, y: number, w: number, h: number): void => {
        this.display.ctx.fillStyle = color
        this.display.ctx.fillRect(x, y, w, h)
    }

    this.castRay = (p1: Vector2, p2: Vector2): Vector2 => {
        const start = p1
        while (start.sqrDistanceTo(p1) < FAR_CLIPPING_PLANE * FAR_CLIPPING_PLANE) {
            const c = hittingCell(p1, p2)
            if (this.scene.isWall(c)) break
            const p3 = rayStep(p1, p2)

            p1 = p2
            p2 = p3
        }

        return p2
    }
} as unknown as GameStateConstructor

export interface GameRenderer {
    renderGame(deltaTime: number): void
}

export interface GameRendererConstructor {
    new (gameState: GameState): GameRenderer
}

export const GameRenderer = function (this: GameRenderer, gameState: GameState) {
    const visibleSprites: Sprite[] = []
    const dts: number[] = []

    function drawMinimapGrid(gridSize: Vector2, strokeStyle: string, lineWidth: number): void {
        for (let x = 0; x <= gridSize.x; x++) {
            gameState.drawLine(strokeStyle, new Vector2(x, 0), new Vector2(x, gridSize.y), lineWidth)
        }

        for (let y = 0; y <= gridSize.y; y++) {
            gameState.drawLine(strokeStyle, new Vector2(0, y), new Vector2(gridSize.x, y), lineWidth)
        }
    }

    function drawMinimapWalls(gridSize: Vector2): void {
        for (let y = 0; y < gridSize.y; y++) {
            for (let x = 0; x < gridSize.x; x++) {
                const cell = gameState.scene.getTile(new Vector2(x, y))
                if (cell instanceof Rgba) {
                    gameState.drawRect(cell.toStyle(), x, y, 1, 1)
                } else if (cell instanceof ImageData) {
                    gameState.drawRect("blue", x, y, 1, 1)
                }
            }
        }
    }

    function renderMinimap(): void {
        gameState.display.ctx.save()

        const cellSize = gameState.canvas.width * MINIMAP_SCALE
        const gridSize = gameState.scene.size()

        gameState.display.ctx.translate(gameState.canvas.width * MINIMAP_SCALE, gameState.canvas.height * MINIMAP_SCALE)
        gameState.display.ctx.scale(cellSize, cellSize)
        gameState.drawRect("#181818", 0, 0, gridSize.x, gridSize.y)
        drawMinimapWalls(gridSize)
        drawMinimapGrid(gridSize, "#303030", 0.05)
        gameState.drawRect(
            "magenta",
            gameState.player.position.x - MINIMAP_PLAYER_SIZE * 0.5,
            gameState.player.position.y - MINIMAP_PLAYER_SIZE * 0.5,
            MINIMAP_PLAYER_SIZE,
            MINIMAP_PLAYER_SIZE,
        )

        const [p1, p2] = gameState.player.fovRange()
        gameState.drawLine("magenta", p1, p2, 0.05)
        gameState.drawLine("magenta", gameState.player.position, p1, 0.05)
        gameState.drawLine("magenta", gameState.player.position, p2, 0.05)

        if (MINIMAP_SPRITES) {
            const sp = new Vector2()
            const dir = new Vector2().setAngle(gameState.player.direction)
            gameState.drawLine("yellow", gameState.player.position, gameState.player.position.clone().add(dir), 0.05)

            for (let sprite of gameState.sprites) {
                gameState.drawRect(
                    "red",
                    sprite.position.x - MINIMAP_SPRITE_SIZE * 0.5,
                    sprite.position.y - MINIMAP_SPRITE_SIZE * 0.5,
                    MINIMAP_SPRITE_SIZE,
                    MINIMAP_SPRITE_SIZE,
                )

                // TODO: deduplicate code between here and renderSprites()
                // gameState code is important for trouble shooting anything related to projecting sprites
                sp.copy(sprite.position).sub(gameState.player.position)
                gameState.drawLine("red", gameState.player.position, gameState.player.position.clone().add(sp), 0.005)
                const spl = sp.length()
                if (spl <= NEAR_CLIPPING_PLANE) continue // Sprite is too close
                if (spl >= FAR_CLIPPING_PLANE) continue // Sprite is too far
                const dot = sp.dot(dir) / spl
                gameState.drawText(
                    "white",
                    "0.5px bold",
                    String(dot),
                    gameState.player.position.x,
                    gameState.player.position.y,
                )
                if (!(COS_OF_HALF_FOV <= dot)) continue
                const dist = NEAR_CLIPPING_PLANE / dot
                sp.norm().scale(dist).add(gameState.player.position)
                gameState.drawRect(
                    "white",
                    sp.x - MINIMAP_SPRITE_SIZE * 0.5,
                    sp.y - MINIMAP_SPRITE_SIZE * 0.5,
                    MINIMAP_SPRITE_SIZE,
                    MINIMAP_SPRITE_SIZE,
                )
            }
        }

        gameState.display.ctx.restore()
    }

    function calculateSpriteVisibility(sprite: Sprite): void {
        const sp = new Vector2()
        const dir = new Vector2().setAngle(gameState.player.direction)
        const [p1, p2] = gameState.player.fovRange()
        sp.copy(sprite.position).sub(gameState.player.position)
        const spl = sp.length()
        if (spl <= NEAR_CLIPPING_PLANE) return
        if (spl >= FAR_CLIPPING_PLANE) return

        const dot = sp.dot(dir) / spl
        // TODO: allow sprites to be slightly outside of FOV to make their edges visible
        if (!(COS_OF_HALF_FOV <= dot)) return
        const dist = NEAR_CLIPPING_PLANE / dot
        sp.norm().scale(dist).add(gameState.player.position)
        sprite.t = p1.distanceTo(sp) / p1.distanceTo(p2)
        sprite.pdist = sprite.position.clone().sub(gameState.player.position).dot(dir)

        // TODO: I'm not sure if these checks are necessary considering the `spl <= NEAR_CLIPPING_PLANE` above
        if (sprite.pdist < NEAR_CLIPPING_PLANE) return
        if (sprite.pdist >= FAR_CLIPPING_PLANE) return

        visibleSprites.push(sprite)
    }

    function drawSprite(sprite: Sprite): void {
        const cx = gameState.display.backImageData.width * sprite.t
        const cy = gameState.display.backImageData.height * 0.5
        const maxSpriteSize = gameState.display.backImageData.height / sprite.pdist
        const spriteSize = maxSpriteSize * sprite.scale
        const x1 = Math.floor(cx - spriteSize * 0.5)
        const x2 = Math.floor(x1 + spriteSize - 1)
        const bx1 = Math.max(0, x1)
        const bx2 = Math.min(gameState.display.backImageData.width - 1, x2)
        const y1 = Math.floor(cy + maxSpriteSize * 0.5 - maxSpriteSize * sprite.z)
        const y2 = Math.floor(y1 + spriteSize - 1)
        const by1 = Math.max(0, y1)
        const by2 = Math.min(gameState.display.backImageData.height - 1, y2)

        const src = sprite.imageData.data
        const dest = gameState.display.backImageData.data

        for (let x = bx1; x <= bx2; x++) {
            if (sprite.pdist < gameState.display.zBuffer[x]) {
                for (let y = by1; y <= by2; y++) {
                    const tx = Math.floor(((x - x1) / spriteSize) * sprite.imageData.width)
                    const ty = Math.floor(((y - y1) / spriteSize) * sprite.imageData.height)
                    const srcP = (ty * sprite.imageData.width + tx) * 4
                    const destP = (y * gameState.display.backImageData.width + x) * 4
                    const alpha = src[srcP + 3] / 255
                    dest[destP + 0] = dest[destP + 0] * (1 - alpha) + src[srcP + 0] * alpha
                    dest[destP + 1] = dest[destP + 1] * (1 - alpha) + src[srcP + 1] * alpha
                    dest[destP + 2] = dest[destP + 2] * (1 - alpha) + src[srcP + 2] * alpha
                }
            }
        }
    }

    function renderSprites(): void {
        visibleSprites.length = 0
        gameState.sprites.forEach(calculateSpriteVisibility)

        visibleSprites.sort((a, b) => b.pdist - a.pdist)
        visibleSprites.forEach(drawSprite)
    }

    function renderFloorAndCeiling(): void {
        const imageData = gameState.display.backImageData
        const pz = imageData.height / 2
        const [p1, p2] = gameState.player.fovRange()
        const bp = p1.clone().sub(gameState.player.position).length()
        for (let y = Math.floor(imageData.height / 2); y < imageData.height; y++) {
            const sz = imageData.height - y - 1

            const ap = pz - sz
            const b = ((bp / ap) * pz) / NEAR_CLIPPING_PLANE
            const t1 = gameState.player.position.clone().add(p1.clone().sub(gameState.player.position).norm().scale(b))
            const t2 = gameState.player.position.clone().add(p2.clone().sub(gameState.player.position).norm().scale(b))

            // TODO: render rows up until FAR_CLIPPING_PLANE

            for (let x = 0; x < imageData.width; ++x) {
                const t = t1.clone().lerp(t2, x / imageData.width)
                const floorTile = gameState.scene.getFloor(t)
                if (floorTile instanceof Rgba) {
                    const shadow = gameState.player.position.distanceTo(t)
                    const destP = (y * imageData.width + x) * 4
                    imageData.data[destP + 0] = floorTile.r * shadow * 255
                    imageData.data[destP + 1] = floorTile.g * shadow * 255
                    imageData.data[destP + 2] = floorTile.b * shadow * 255
                }
                const ceilingTile = gameState.scene.getCeiling(t)
                if (ceilingTile instanceof Rgba) {
                    const shadow = gameState.player.position.distanceTo(t)
                    const destP = (sz * imageData.width + x) * 4
                    imageData.data[destP + 0] = ceilingTile.r * shadow * 255
                    imageData.data[destP + 1] = ceilingTile.g * shadow * 255
                    imageData.data[destP + 2] = ceilingTile.b * shadow * 255
                }
            }
        }
    }

    function renderWalls() {
        const [r1, r2] = gameState.player.fovRange()
        const d = new Vector2().setAngle(gameState.player.direction)
        for (let x = 0; x < gameState.display.backImageData.width; x++) {
            const p = gameState.castRay(
                gameState.player.position,
                r1.clone().lerp(r2, x / gameState.display.backImageData.width),
            )
            const c = hittingCell(gameState.player.position, p)
            const cell = gameState.scene.getTile(c)
            const v = p.clone().sub(gameState.player.position)
            gameState.display.zBuffer[x] = v.dot(d)
            if (cell instanceof Rgba) {
                const stripHeight = gameState.display.backImageData.height / gameState.display.zBuffer[x]
                const shadow = (1 / gameState.display.zBuffer[x]) * 2
                for (let dy = 0; dy < Math.ceil(stripHeight); dy++) {
                    const y = Math.floor((gameState.display.backImageData.height - stripHeight) * 0.5) + dy
                    const destP = (y * gameState.display.backImageData.width + x) * 4
                    gameState.display.backImageData.data[destP + 0] = cell.r * shadow * 255
                    gameState.display.backImageData.data[destP + 1] = cell.g * shadow * 255
                    gameState.display.backImageData.data[destP + 2] = cell.b * shadow * 255
                }
            } else if (cell instanceof ImageData) {
                const stripHeight = gameState.display.backImageData.height / gameState.display.zBuffer[x]
                let u = 0
                const t = p.clone().sub(c)
                if (Math.abs(t.x) < EPS && t.y > 0) {
                    u = t.y
                } else if (Math.abs(t.x - 1) < EPS && t.y > 0) {
                    u = 1 - t.y
                } else if (Math.abs(t.y) < EPS && t.x > 0) {
                    u = 1 - t.x
                } else {
                    u = t.x
                }

                const y1 = Math.floor((gameState.display.backImageData.height - stripHeight) * 0.5)
                const y2 = Math.floor(y1 + stripHeight)
                const by1 = Math.max(0, y1)
                const by2 = Math.min(gameState.display.backImageData.height - 1, y2)
                const tx = Math.floor(u * cell.width)
                const sh = (1 / Math.ceil(stripHeight)) * cell.height
                const shadow = Math.min((1 / gameState.display.zBuffer[x]) * 4, 1)
                for (let y = by1; y <= by2; y++) {
                    const ty = Math.floor((y - y1) * sh)
                    const destP = (y * gameState.display.backImageData.width + x) * 4
                    const srcP = (ty * cell.width + tx) * 4
                    gameState.display.backImageData.data[destP + 0] = cell.data[srcP + 0] * shadow
                    gameState.display.backImageData.data[destP + 1] = cell.data[srcP + 1] * shadow
                    gameState.display.backImageData.data[destP + 2] = cell.data[srcP + 2] * shadow
                }
            }
        }
    }

    function renderFPS(deltaTime: number) {
        dts.push(deltaTime)
        // can be any number of frames
        if (dts.length > 60) dts.shift()

        let dtAvg = 0
        for (const dt of dts) {
            dtAvg += dt
        }
        dtAvg /= dts.length

        gameState.drawText("white", "48px bold", String(Math.floor(1 / dtAvg)), 100, 100)
    }

    this.renderGame = (deltaTime: number) => {
        gameState.player.velocity.setScalar(0)
        let angularVelocity = 0.0

        if (gameState.player.movingForward) {
            gameState.player.velocity.add(new Vector2().setAngle(gameState.player.direction, PLAYER_SPEED))
        }
        if (gameState.player.movingBackward) {
            gameState.player.velocity.sub(new Vector2().setAngle(gameState.player.direction, PLAYER_SPEED))
        }
        if (gameState.player.movingLeft) {
            gameState.player.velocity.add(
                new Vector2().setAngle(gameState.player.direction - Math.PI / 2, PLAYER_SPEED),
            )
        }
        if (gameState.player.movingRight) {
            gameState.player.velocity.add(
                new Vector2().setAngle(gameState.player.direction + Math.PI / 2, PLAYER_SPEED),
            )
        }
        if (gameState.player.turningLeft) {
            angularVelocity -= PLAYER_TURN_SPEED
        }
        if (gameState.player.turningRight) {
            angularVelocity += PLAYER_TURN_SPEED
        }

        gameState.player.direction = gameState.player.direction + angularVelocity * deltaTime
        const nx = gameState.player.position.x + gameState.player.velocity.x * deltaTime
        if (
            gameState.scene.canRectangleFitHere(
                nx,
                gameState.player.position.y,
                MINIMAP_PLAYER_SIZE,
                MINIMAP_PLAYER_SIZE,
            )
        ) {
            gameState.player.position.x = nx
        }
        const ny = gameState.player.position.y + gameState.player.velocity.y * deltaTime
        if (
            gameState.scene.canRectangleFitHere(
                gameState.player.position.x,
                ny,
                MINIMAP_PLAYER_SIZE,
                MINIMAP_PLAYER_SIZE,
            )
        ) {
            gameState.player.position.y = ny
        }

        renderFloorAndCeiling()
        renderWalls()
        renderSprites()
        gameState.display.swapBackImageData()
        renderMinimap()
        renderFPS(deltaTime)
    }
} as unknown as GameRendererConstructor

function rayStep(p1: Vector2, p2: Vector2): Vector2 {
    let p3 = p2
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y

    if (dx !== 0) {
        const k = dy / dx
        const c = p1.y - k * p1.x

        {
            const x3 = snap(p2.x, dx)
            const y3 = x3 * k + c
            p3 = new Vector2(x3, y3)
        }

        if (k !== 0) {
            const y3 = snap(p2.y, dy)
            const x3 = (y3 - c) / k
            const p3t = new Vector2(x3, y3)
            if (p2.sqrDistanceTo(p3t) < p2.sqrDistanceTo(p3)) {
                p3 = p3t
            }
        }
    } else {
        const y3 = snap(p2.y, dy)
        const x3 = p2.x
        p3 = new Vector2(x3, y3)
    }

    return p3
}

function hittingCell(p1: Vector2, p2: Vector2): Vector2 {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return new Vector2(Math.floor(p2.x + Math.sign(dx) * EPS), Math.floor(p2.y + Math.sign(dy) * EPS))
}

function snap(x: number, dx: number): number {
    return dx > 0 ? Math.ceil(x + Math.sign(dx) * EPS) : dx < 0 ? Math.floor(x + Math.sign(dx) * EPS) : x
}
