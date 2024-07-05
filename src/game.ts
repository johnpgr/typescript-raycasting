import { DEFAULT_MOVESPEED, EPS, FACTOR, FAR_CLIPPING_PLANE, FOV, NEAR_CLIPPING_PLANE, SCREEN_WIDTH } from "./consts.js"
import { assert } from "./utils.js"

export interface Vector2 {
    readonly x: number
    readonly y: number

    length(): number
    sqrLength(): number
    add(v: Vector2): Vector2
    divide(v: Vector2): Vector2
    subtract(v: Vector2): Vector2
    multiply(v: Vector2): Vector2
    scale(scalar: number): Vector2
    distanceTo(v: Vector2): number
    sqrDistanceTo(v: Vector2): number
    rotate90(): Vector2
    dotProduct(v: Vector2): number
    interpolate(v: Vector2, t: number): Vector2
    normalize(): Vector2
    map(fn: (x: number) => number): Vector2
    [Symbol.iterator](): IterableIterator<number>
}

export function Vector2(x: number, y: number): Vector2 {
    const self = { x, y } as Vector2

    self.length = function () {
        return Math.sqrt(Math.pow(self.x, 2) + Math.pow(self.y, 2))
    }

    self.sqrLength = function () {
        return Math.pow(self.x, 2) + Math.pow(self.y, 2)
    }

    self.normalize = function (): Vector2 {
        if (self.length() === 0) {
            return Vector2.zero()
        }

        return Vector2(self.x / self.length(), self.y / self.length())
    }

    self.divide = function (v: Vector2): Vector2 {
        return Vector2(self.x / v.x, self.y / v.y)
    }

    self.add = function (v: Vector2): Vector2 {
        return Vector2(self.x + v.x, self.y + v.y)
    }

    self.subtract = function (v: Vector2): Vector2 {
        return Vector2(self.x - v.x, self.y - v.y)
    }

    self.multiply = function (v: Vector2): Vector2 {
        return Vector2(self.x * v.x, self.y * v.y)
    }

    self.scale = function (amount: number): Vector2 {
        return Vector2(self.x * amount, self.y * amount)
    }

    self.distanceTo = function (v: Vector2): number {
        return self.subtract(v).length()
    }

    self.sqrDistanceTo = function (v: Vector2): number {
        return self.subtract(v).sqrLength()
    }

    self.rotate90 = function (): Vector2 {
        return Vector2(-self.y, self.x)
    }

    self.dotProduct = function (v: Vector2): number {
        return self.x * v.x + self.y * v.y
    }

    self.interpolate = function (v: Vector2, t: number): Vector2 {
        return v.subtract(self).scale(t).add(self)
    }

    self.map = function (fn: (x: number) => number): Vector2 {
        return Vector2(fn(self.x), fn(self.y))
    }

    self[Symbol.iterator] = function* () {
        yield self.x
        yield self.y
    }

    return self
}

export namespace Vector2 {
    export function zero(): Vector2 {
        return Vector2(0, 0)
    }

    export function fromAngle(angle: number): Vector2 {
        return Vector2(Math.cos(angle), Math.sin(angle))
    }
}

export interface Color {
    readonly r: number
    readonly g: number
    readonly b: number
    readonly a: number

    brightness(factor: number): Color
    toStyle(): string
    [Symbol.iterator](): IterableIterator<number>
}

export function Color(r: number, g: number, b: number, a: number): Color {
    const self = { r, g, b, a } as Color

    self.brightness = function (factor: number): Color {
        return Color(self.r * factor, self.g * factor, self.b * factor, self.a)
    }

    self.toStyle = function (): string {
        const r = Math.floor(self.r * 255)
        const g = Math.floor(self.g * 255)
        const b = Math.floor(self.b * 255)

        return `rgba(${r}, ${g}, ${b}, ${self.a})`
    }

    self[Symbol.iterator] = function* () {
        yield self.r
        yield self.g
        yield self.b
        yield self.a
    }

    return self
}

export namespace Color {
    export function isColor(x: any): x is Color {
        if ("r" in x && "g" in x && "b" in x && "a" in x) {
            return true
        }
        return false
    }
    export function red(): Color {
        return Color(1, 0, 0, 1)
    }
    export function blue(): Color {
        return Color(0, 0, 1, 1)
    }
    export function green(): Color {
        return Color(0, 1, 0, 1)
    }
    export function magenta(): Color {
        return Color(1, 0, 1, 1)
    }
    export function yellow(): Color {
        return Color(1, 1, 0, 1)
    }
    export function cyan(): Color {
        return Color(0, 1, 1, 1)
    }
    export function white(): Color {
        return Color(1, 1, 1, 1)
    }
    export function black(): Color {
        return Color(0, 0, 0, 1)
    }
}

export interface Entity {
    position: Vector2
    direction: number
    movespeed: number
}

export function Entity(position: Vector2, direction: number, movespeed: number): Entity {
    const self = { position, direction, movespeed } as Entity

    return self
}

export interface PlayerEntity extends Entity {
    movingForward: boolean
    movingBackward: boolean
    movingLeft: boolean
    movingRight: boolean
    turningLeft: boolean
    turningRight: boolean

    fovRange(): [Vector2, Vector2]
}

export function PlayerEntity(position: Vector2, direction: number): PlayerEntity {
    const self = Entity(position, direction, DEFAULT_MOVESPEED) as PlayerEntity
    self.movingForward = false
    self.movingBackward = false
    self.turningLeft = false
    self.turningRight = false
    self.movingRight = false
    self.movingLeft = false

    self.fovRange = function (): [Vector2, Vector2] {
        const l = Math.tan(FOV * 0.5) * NEAR_CLIPPING_PLANE
        const p = self.position.add(Vector2.fromAngle(self.direction).scale(NEAR_CLIPPING_PLANE))
        const p1 = p.subtract(p.subtract(self.position).rotate90().normalize().scale(l))
        const p2 = p.add(p.subtract(self.position).rotate90().normalize().scale(l))

        return [p1, p2]
    }

    return self
}

export type SceneCell = Color | HTMLImageElement | null

export interface Scene {
    cells: SceneCell[][]

    size(): Vector2
}

export function Scene(cells: SceneCell[][]) {
    const self = { cells } as Scene

    self.size = function (): Vector2 {
        const y = self.cells.length
        let x = Number.MIN_VALUE
        for (const row of self.cells) {
            x = Math.max(x, row.length)
        }
        return Vector2(x, y)
    }

    return self
}

export interface Minimap {
    size: Vector2
    position: Vector2
}

export function Minimap(size: Vector2, position: Vector2): Minimap {
    const self = { size, position } as Minimap

    return self
}

export interface Game {
    canvas: HTMLCanvasElement
    scene: Scene
    ctx: CanvasRenderingContext2D
    player: PlayerEntity
    minimap: Minimap

    canvasSize(): Vector2
    render(): void
}

export function Game(canvas: HTMLCanvasElement, scene: Scene, player: PlayerEntity, minimap: Minimap): Game {
    const self = {} as Game

    self.canvas = canvas
    self.scene = scene
    self.canvas.width = 16 * FACTOR
    self.canvas.height = 9 * FACTOR
    const _ctx = canvas.getContext("2d")
    assert(_ctx !== null, "2D not supported OMEGALUL")
    self.ctx = _ctx
    self.player = player
    self.minimap = minimap

    self.canvasSize = function () {
        return Vector2(self.ctx.canvas.width, self.ctx.canvas.height)
    }

    self.render = function () {
        drawBackground("#181818")
        renderScene()
        renderMinimap()
    }

    function drawCircle(p: Vector2, fillStyle: string, radius: number): void {
        self.ctx.fillStyle = fillStyle
        self.ctx.beginPath()
        //@ts-ignore
        self.ctx.arc(...p, radius, 0, Math.PI * 2)
        self.ctx.fill()
    }

    function drawLine(p1: Vector2, p2: Vector2, strokeStyle: string, lineWidth: number): void {
        self.ctx.strokeStyle = strokeStyle
        self.ctx.lineWidth = lineWidth
        self.ctx.beginPath()
        //@ts-ignore
        self.ctx.moveTo(...p1)
        //@ts-ignore
        self.ctx.lineTo(...p2)
        self.ctx.stroke()
    }

    function drawRect(color: string, x: number, y: number, w: number, h: number): void {
        self.ctx.fillStyle = color
        self.ctx.fillRect(x, y, w, h)
    }

    function drawBackground(fillStyle: string): void {
        self.ctx.fillStyle = fillStyle
        self.ctx.fillRect(0, 0, self.canvas.width, self.canvas.height)
    }

    function drawMinimapGrid(strokeStyle: string, lineWidth: number): void {
        for (let x = 0; x <= self.scene.size().x; x++) {
            drawLine(Vector2(x, 0), Vector2(x, self.scene.size().y), strokeStyle, lineWidth)
        }

        for (let y = 0; y <= self.scene.size().y; y++) {
            drawLine(Vector2(0, y), Vector2(self.scene.size().x, y), strokeStyle, lineWidth)
        }
    }

    function drawMinimapWalls(): void {
        for (let y = 0; y < self.scene.size().y; y++) {
            for (let x = 0; x < self.scene.size().x; x++) {
                const cell = self.scene.cells[y][x]
                if (cell !== null) {
                    if (cell instanceof HTMLImageElement) {
                        self.ctx.drawImage(cell, x, y, 1, 1)
                    } else if (Color.isColor(cell)) {
                        drawRect(cell.toStyle(), x, y, 1, 1)
                    }
                }
            }
        }
    }

    function renderMinimap(): void {
        self.ctx.save()
        // @ts-ignore
        self.ctx.translate(...self.minimap.position)
        // @ts-ignore
        self.ctx.scale(...self.minimap.size.divide(self.scene.size()))
        // @ts-ignore
        drawRect("#181818", 0, 0, ...self.scene.size())
        drawMinimapWalls()
        drawMinimapGrid("#303030", 0.05)
        drawCircle(self.player.position, "magenta", 0.2)

        const [p1, p2] = self.player.fovRange()
        drawLine(p1, p2, "magenta", 0.1)
        drawLine(self.player.position, p1, "magenta", 0.1)
        drawLine(self.player.position, p2, "magenta", 0.1)
        self.ctx.restore()
    }

    function renderScene(): void {
        const stripWidth = Math.ceil(self.ctx.canvas.width / SCREEN_WIDTH)
        const [r1, r2] = self.player.fovRange()

        for (let x = 0; x < SCREEN_WIDTH; x++) {
            const p = castRay(self.scene, self.player.position, r1.interpolate(r2, x / SCREEN_WIDTH))
            const c = getHittingCellPos(self.player.position, p)

            if (isPointInSceneBounds(self.scene, c)) {
                const cell = self.scene.cells[c.y][c.x]

                if (cell !== null) {
                    const v = p.subtract(self.player.position)
                    const d = Vector2.fromAngle(self.player.direction)
                    const stripHeight = self.canvas.height / v.dotProduct(d)

                    if (cell instanceof HTMLImageElement) {
                        const t = p.subtract(c)
                        let u = 0

                        if ((Math.abs(t.x) < EPS || Math.abs(t.x - 1) < EPS) && t.y > 0) {
                            u = t.y
                        } else {
                            u = t.x
                        }

                        self.ctx.drawImage(
                            cell,
                            u * cell.width,
                            0,
                            1,
                            cell.height,
                            x * stripWidth,
                            (self.canvas.height - stripHeight) * 0.5,
                            stripWidth,
                            stripHeight,
                        )
                    } else if (Color.isColor(cell)) {
                        drawRect(
                            cell.brightness(1 / v.dotProduct(d)).toStyle(),
                            x * stripWidth,
                            (self.canvas.height - stripHeight) * 0.5,
                            stripWidth,
                            stripHeight,
                        )
                    }
                }
            }
        }
    }

    return self
}

function rayStep(p1: Vector2, p2: Vector2): Vector2 {
    const d = p2.subtract(p1)
    let p3 = p2

    if (d.x !== 0) {
        const k = d.y / d.x
        const c = p1.y - k * p1.x

        {
            const x3 = snap(p2.x, d.x)
            const y3 = x3 * k + c
            const p3x = Vector2(x3, y3)
            p3 = p3x
        }

        if (k !== 0) {
            const y3 = snap(p2.y, d.y)
            const x3 = (y3 - c) / k
            const p3y = Vector2(x3, y3)
            if (p2.sqrDistanceTo(p3y) < p2.sqrDistanceTo(p3)) {
                p3 = p3y
            }
        }
    } else {
        const y3 = snap(p2.y, d.y)
        const x3 = p2.x
        p3 = Vector2(x3, y3)
    }

    return p3
}

function getHittingCellPos(p1: Vector2, p2: Vector2): Vector2 {
    const d = p2.subtract(p1)
    return Vector2(Math.floor(p2.x + Math.sign(d.x) * EPS), Math.floor(p2.y + Math.sign(d.y) * EPS))
}

function snap(x: number, dx: number): number {
    return dx > 0 ? Math.ceil(x + Math.sign(dx) * EPS) : dx < 0 ? Math.floor(x + Math.sign(dx) * EPS) : x
}

export function isPointInSceneBounds(scene: Scene, p: Vector2): boolean {
    const size = scene.size()
    return 0 <= p.x && p.x < size.x && 0 <= p.y && p.y < size.y
}

function castRay(scene: Scene, p1: Vector2, p2: Vector2): Vector2 {
    const start = p1
    while (start.sqrDistanceTo(p1) < FAR_CLIPPING_PLANE * FAR_CLIPPING_PLANE) {
        const c = getHittingCellPos(p1, p2)
        if (isPointInSceneBounds(scene, c) && scene.cells[c.y][c.x] !== null) break

        const p3 = rayStep(p1, p2)

        p1 = p2
        p2 = p3
    }

    return p2
}
