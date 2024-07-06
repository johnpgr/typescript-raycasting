export class Vector2 {
    x: number
    y: number
    constructor(x: number = 0, y: number = 0) {
        this.x = x
        this.y = y
    }
    setAngle(angle: number, len: number = 1): this {
        this.x = Math.cos(angle) * len
        this.y = Math.sin(angle) * len
        return this
    }
    clone(): Vector2 {
        return new Vector2(this.x, this.y)
    }
    copy(that: Vector2): this {
        this.x = that.x
        this.y = that.y
        return this
    }
    setScalar(scalar: number): this {
        this.x = scalar
        this.y = scalar
        return this
    }
    add(that: Vector2): this {
        this.x += that.x
        this.y += that.y
        return this
    }
    sub(that: Vector2): this {
        this.x -= that.x
        this.y -= that.y
        return this
    }
    div(that: Vector2): this {
        this.x /= that.x
        this.y /= that.y
        return this
    }
    mul(that: Vector2): this {
        this.x *= that.x
        this.y *= that.y
        return this
    }
    sqrLength(): number {
        return this.x * this.x + this.y * this.y
    }
    length(): number {
        return Math.sqrt(this.sqrLength())
    }
    scale(value: number): this {
        this.x *= value
        this.y *= value
        return this
    }
    norm(): this {
        const l = this.length()
        return l === 0 ? this : this.scale(1 / l)
    }
    rot90(): this {
        const oldX = this.x
        this.x = -this.y
        this.y = oldX
        return this
    }
    sqrDistanceTo(that: Vector2): number {
        const dx = that.x - this.x
        const dy = that.y - this.y
        return dx * dx + dy * dy
    }
    distanceTo(that: Vector2): number {
        return Math.sqrt(this.sqrDistanceTo(that))
    }
    lerp(that: Vector2, t: number): this {
        this.x += (that.x - this.x) * t
        this.y += (that.y - this.y) * t
        return this
    }
    dot(that: Vector2): number {
        return this.x * that.x + this.y * that.y
    }
    map(f: (x: number) => number): this {
        this.x = f(this.x)
        this.y = f(this.y)
        return this
    }
}

export class Rgba {
    r: number
    g: number
    b: number
    a: number
    constructor(r: number, g: number, b: number, a: number) {
        this.r = r
        this.g = g
        this.b = b
        this.a = a
    }
    static red(): Rgba {
        return new Rgba(1, 0, 0, 1)
    }
    static green(): Rgba {
        return new Rgba(0, 1, 0, 1)
    }
    static blue(): Rgba {
        return new Rgba(0, 0, 1, 1)
    }
    static yellow(): Rgba {
        return new Rgba(1, 1, 0, 1)
    }
    static purple(): Rgba {
        return new Rgba(1, 0, 1, 1)
    }
    static cyan(): Rgba {
        return new Rgba(0, 1, 1, 1)
    }
    toStyle(): string {
        return `rgba(${this.r * 255}, ${this.g * 255}, ${this.b * 255}, ${this.a})`
    }
}

export const EPS = 1e-6
export const SCREEN_FACTOR = 30
export const SCREEN_WIDTH = Math.floor(16 * SCREEN_FACTOR)
export const SCREEN_HEIGHT = Math.floor(9 * SCREEN_FACTOR)
export const NEAR_CLIPPING_PLANE = 0.1
export const FAR_CLIPPING_PLANE = 10.0
export const PLAYER_SPEED = 2.0
export const PLAYER_TURN_SPEED = Math.PI
export const PLAYER_FOV = Math.PI * 0.5
export const PLAYER_SIZE = 0.5
export const COS_OF_HALF_FOV = Math.cos(PLAYER_FOV * 0.5)
export const SCENE_FLOOR1 = new Rgba(0.094, 0.094 + 0.07, 0.094 + 0.07, 1.0)
export const SCENE_FLOOR2 = new Rgba(0.188, 0.188 + 0.07, 0.188 + 0.07, 1.0)
export const SCENE_CEILING1 = new Rgba(0.094 + 0.07, 0.094, 0.094, 1.0)
export const SCENE_CEILING2 = new Rgba(0.188 + 0.07, 0.188, 0.188, 1.0)
export const MINIMAP_SPRITES = false
export const MINIMAP_PLAYER_SIZE = 0.5
export const MINIMAP_SPRITE_SIZE = 0.3
export const MINIMAP_SCALE = 0.03
