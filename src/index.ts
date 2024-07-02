const EPS = 1e-6
const FACTOR = 80
const SCREEN_WIDTH = 240
const NEAR_CLIPPING_PLANE = 1.0
const FAR_CLIPPING_PLANE = 10.0
const FOV = Math.PI * 0.5
const PLAYER_SPEED = 0.05

function assert(condition: boolean, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message)
    }
}

class Vector2 {
    public x: number
    public y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    static ZERO(): Vector2 {
        return new Vector2(0, 0)
    }

    static fromAngle(angle: number): Vector2 {
        return new Vector2(Math.cos(angle), Math.sin(angle))
    }

    get length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
    }

    public normalize(): Vector2 {
        if (this.length === 0) {
            return new Vector2(0, 0)
        }

        return new Vector2(this.x / this.length, this.y / this.length)
    }

    public divide(v: Vector2): Vector2 {
        return new Vector2(this.x / v.x, this.y / v.y)
    }

    public add(v: Vector2): Vector2 {
        return new Vector2(this.x + v.x, this.y + v.y)
    }

    public subtract(v: Vector2): Vector2 {
        return new Vector2(this.x - v.x, this.y - v.y)
    }

    public multiply(v: Vector2): Vector2 {
        return new Vector2(this.x * v.x, this.y * v.y)
    }

    public scale(amount: number): Vector2 {
        return new Vector2(this.x * amount, this.y * amount)
    }

    /**
     * Returns the angle of the vector in radians.
     */
    public distance(v: Vector2): number {
        return this.subtract(v).length
    }

    /**
     * Returns a new vector that is the result of rotating this vector by 90 degrees.
     */
    public rotate90(): Vector2 {
        return new Vector2(-this.y, this.x)
    }

    /**
     * Dot notation of two vectors.
     */
    public dotProduct(v: Vector2): number {
        return this.x * v.x + this.y * v.y
    }

    /**
     * Returns a new vector that is the linear interpolation between this vector
     * and the given vector.
     * @param v - The vector to interpolate with
     * @param t - The interpolation factor
     * @returns A new vector that is the linear interpolation between this vector
     */
    public interpolate(v: Vector2, t: number): Vector2 {
        return v.subtract(this).scale(t).add(this)
    }

    *[Symbol.iterator]() {
        yield this.x
        yield this.y
    }
}

class Entity {
    public position: Vector2
    public direction: number

    constructor(position: Vector2, direction: number) {
        this.position = position
        this.direction = direction
    }
}

class PlayerEntity extends Entity {
    /**
     * Returns the coordinates of the two points that represent the player's
     * field of view.
     */
    public fovRange(): [Vector2, Vector2] {
        const l = Math.tan(FOV * 0.5) * NEAR_CLIPPING_PLANE
        const p = this.position.add(Vector2.fromAngle(this.direction).scale(NEAR_CLIPPING_PLANE))
        const p1 = p.subtract(p.subtract(this.position).rotate90().normalize().scale(l))
        const p2 = p.add(p.subtract(this.position).rotate90().normalize().scale(l))

        return [p1, p2]
    }
}

type SceneCell = string | null

class Scene {
    public readonly cells: SceneCell[][]

    constructor(cells: SceneCell[][]) {
        this.cells = cells
    }

    get size(): Vector2 {
        const y = this.cells.length
        let x = Number.MIN_VALUE
        for (const row of this.cells) {
            x = Math.max(x, row.length)
        }

        return new Vector2(x, y)
    }
}

class Minimap {
    public size: Vector2
    public position: Vector2

    constructor(size: Vector2, position: Vector2) {
        this.size = size
        this.position = position
    }
}

class Game {
    public canvas: HTMLCanvasElement
    public scene: Scene
    public ctx: CanvasRenderingContext2D
    public player: PlayerEntity
    public minimap: Minimap

    constructor(canvas: HTMLCanvasElement, scene: Scene, player: PlayerEntity, minimap: Minimap) {
        this.canvas = canvas
        this.scene = scene
        this.canvas.width = 16 * FACTOR
        this.canvas.height = 9 * FACTOR

        const _ctx = canvas.getContext("2d")
        assert(_ctx !== null, "2D not supported OMEGALUL")
        this.ctx = _ctx

        this.player = player
        this.minimap = minimap
    }

    get canvasSize(): Vector2 {
        return new Vector2(this.ctx.canvas.width, this.ctx.canvas.height)
    }

    /**
     * Draws a circle on the canvas.
     * @param p - The center of the circle
     * @param fillStyle - The color of the circle
     * @param radius - The radius of the circle
     */
    private drawCircle(p: Vector2, fillStyle: string, radius: number): void {
        this.ctx.fillStyle = fillStyle
        this.ctx.beginPath()
        //@ts-ignore
        this.ctx.arc(...p, radius, 0, Math.PI * 2)
        this.ctx.fill()
    }

    /**
     * Draws a line on the canvas.
     * @param p1 - The starting point of the line
     * @param p2 - The ending point of the line
     * @param strokeStyle - The color of the line
     * @param lineWidth - The width of the line
     */
    private drawLine(p1: Vector2, p2: Vector2, strokeStyle: string, lineWidth: number): void {
        this.ctx.strokeStyle = strokeStyle
        this.ctx.lineWidth = lineWidth
        this.ctx.beginPath()
        //@ts-ignore
        this.ctx.moveTo(...p1)
        //@ts-ignore
        this.ctx.lineTo(...p2)
        this.ctx.stroke()
    }

    /**
     * Draws a rectangle on the canvas.
     * @param color - The color of the rectangle
     * @param x - The x-coordinate of the top-left corner of the rectangle
     * @param y - The y-coordinate of the top-left corner of the rectangle
     * @param w - The width of the rectangle
     * @param h - The height of the rectangle
     */
    private drawRect(color: string, x: number, y: number, w: number, h: number): void {
        this.ctx.fillStyle = color
        this.ctx.fillRect(x, y, w, h)
    }

    public drawBackground(fillStyle: string): void {
        this.ctx.fillStyle = fillStyle
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    private drawMinimapGrid(strokeStyle: string, lineWidth: number): void {
        for (let x = 0; x <= this.scene.size.x; x++) {
            this.drawLine(new Vector2(x, 0), new Vector2(x, this.scene.size.y), strokeStyle, lineWidth)
        }

        for (let y = 0; y <= this.scene.size.y; y++) {
            this.drawLine(new Vector2(0, y), new Vector2(this.scene.size.x, y), strokeStyle, lineWidth)
        }
    }

    private drawMinimapWalls(): void {
        for (let y = 0; y < this.scene.size.y; y++) {
            for (let x = 0; x < this.scene.size.x; x++) {
                const color = this.scene.cells[y][x]
                if (color !== null) {
                    this.drawRect(color, x, y, 1, 1)
                }
            }
        }
    }

    public renderMinimap(): void {
        this.ctx.save()
        //@ts-ignore
        this.ctx.translate(...this.minimap.position)
        //@ts-ignore
        this.ctx.scale(...this.minimap.size.divide(this.scene.size))
        //@ts-ignore
        this.drawRect("#181818", 0, 0, ...this.scene.size)
        this.drawMinimapWalls()
        this.drawMinimapGrid("#303030", 0.05)
        this.drawCircle(this.player.position, "magenta", 0.2)

        const [p1, p2] = this.player.fovRange()
        this.drawLine(p1, p2, "magenta", 0.1)
        this.drawLine(this.player.position, p1, "magenta", 0.1)
        this.drawLine(this.player.position, p2, "magenta", 0.1)
        this.ctx.restore()
    }

    public renderScene(): void {
        const stripWidth = Math.ceil(this.ctx.canvas.width / SCREEN_WIDTH)
        const [r1, r2] = this.player.fovRange()

        for (let x = 0; x < SCREEN_WIDTH; x++) {
            const point = castRay(this.scene, this.player.position, r1.interpolate(r2, x / SCREEN_WIDTH))
            const cell = getHittingCellPos(this.player.position, point)

            if (isPointInSceneBounds(this.scene, cell)) {
                const color = this.scene.cells[cell.y][cell.x]

                if (color !== null) {
                    const verticalHeight = point.subtract(this.player.position)
                    const distanceToWall = Vector2.fromAngle(this.player.direction)
                    const stripHeight = this.canvas.height / verticalHeight.dotProduct(distanceToWall)

                    this.drawRect(
                        this.scene.cells[cell.y][cell.x] as string,
                        x * stripWidth,
                        (this.canvas.height - stripHeight) * 0.5,
                        stripWidth,
                        stripHeight,
                    )
                }
            }
        }
    }

    public render(): void {
        this.drawBackground("#181818")
        this.renderScene()
        this.renderMinimap()
    }
}

/**
 * Bresenham's line algorithm
 * @see https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
 */
function rayStep(p1: Vector2, p2: Vector2): Vector2 {
    const d = p2.subtract(p1)
    let p3 = p2

    if (d.x !== 0) {
        const k = d.y / d.x
        const c = p1.y - k * p1.x

        {
            const x3 = snap(p2.x, d.x)
            const y3 = x3 * k + c
            const p3x = new Vector2(x3, y3)
            p3 = p3x
        }

        if (k !== 0) {
            const y3 = snap(p2.y, d.y)
            const x3 = (y3 - c) / k
            const p3y = new Vector2(x3, y3)
            if (p2.distance(p3y) < p2.distance(p3)) {
                p3 = p3y
            }
        }
    } else {
        const y3 = snap(p2.y, d.y)
        const x3 = p2.x
        p3 = new Vector2(x3, y3)
    }

    return p3
}

function getHittingCellPos(p1: Vector2, p2: Vector2): Vector2 {
    const d = p2.subtract(p1)
    return new Vector2(Math.floor(p2.x + Math.sign(d.x) * EPS), Math.floor(p2.y + Math.sign(d.y) * EPS))
}

function snap(x: number, dx: number): number {
    return dx > 0 ? Math.ceil(x + Math.sign(dx) * EPS) : dx < 0 ? Math.floor(x + Math.sign(dx) * EPS) : x
}

function isPointInSceneBounds(scene: Scene, p: Vector2): boolean {
    const size = scene.size
    return 0 <= p.x && p.x < size.x && 0 <= p.y && p.y < size.y
}

function castRay(scene: Scene, p1: Vector2, p2: Vector2): Vector2 {
    while (true) {
        const c = getHittingCellPos(p1, p2)
        if (!isPointInSceneBounds(scene, c) || scene.cells[c.y][c.x] !== null) {
            break
        }
        const p3 = rayStep(p1, p2)
        p1 = p2
        p2 = p3
    }

    return p2
}

function main(): void {
    const canvas = document.getElementById("game") as HTMLCanvasElement | null
    assert(canvas !== null, "Canvas element not found")

    const scene = new Scene([
        [null, null, "red", "blue", null, null, null, null, null],
        [null, null, null, "cyan", null, null, null, null, null],
        [null, "magenta", "yellow", "green", null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
    ])
    const player = new PlayerEntity(Vector2.ZERO(), Math.PI * 1.25)
    const minimap = new Minimap(Vector2.ZERO(), Vector2.ZERO())
    const game = new Game(canvas, scene, player, minimap)

    // Init player position in the middle of the scene
    player.position = game.scene.size.multiply(new Vector2(0.63, 0.63))

    // Init minimap position and size
    minimap.position = Vector2.ZERO().add(game.canvasSize.scale(0.02))
    minimap.size = game.scene.size.scale(game.canvas.width * 0.03)

    window.addEventListener("keydown", (e) => {
        //prettier-ignore
        switch (e.code) {
            case "KeyW": {
                const direction = Vector2.fromAngle(player.direction).scale(PLAYER_SPEED)
                player.position = player.position.add(direction)
                game.render()
            } break

            case "KeyS": {
                const direction = Vector2.fromAngle(player.direction).scale(PLAYER_SPEED)
                player.position = player.position.subtract(direction)
                game.render()
            } break

            case "KeyA": {
                player.direction -= Math.PI * 0.1
                game.render()
            } break

            case "KeyD": {
                player.direction += Math.PI * 0.1
                game.render()
            } break
        }
    })

    game.render()
}

main()
