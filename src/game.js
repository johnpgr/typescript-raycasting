import { DEFAULT_MOVESPEED, EPS, FACTOR, FAR_CLIPPING_PLANE, FOV, NEAR_CLIPPING_PLANE, SCREEN_WIDTH } from "./consts.js";
import { assert } from "./utils.js";
export function Vector2(x, y) {
    const self = { x, y };
    self.length = function () {
        return Math.sqrt(Math.pow(self.x, 2) + Math.pow(self.y, 2));
    };
    self.sqrLength = function () {
        return Math.pow(self.x, 2) + Math.pow(self.y, 2);
    };
    self.normalize = function () {
        if (self.length() === 0) {
            return Vector2.zero();
        }
        return Vector2(self.x / self.length(), self.y / self.length());
    };
    self.divide = function (v) {
        return Vector2(self.x / v.x, self.y / v.y);
    };
    self.add = function (v) {
        return Vector2(self.x + v.x, self.y + v.y);
    };
    self.subtract = function (v) {
        return Vector2(self.x - v.x, self.y - v.y);
    };
    self.multiply = function (v) {
        return Vector2(self.x * v.x, self.y * v.y);
    };
    self.scale = function (amount) {
        return Vector2(self.x * amount, self.y * amount);
    };
    self.distanceTo = function (v) {
        return self.subtract(v).length();
    };
    self.sqrDistanceTo = function (v) {
        return self.subtract(v).sqrLength();
    };
    self.rotate90 = function () {
        return Vector2(-self.y, self.x);
    };
    self.dotProduct = function (v) {
        return self.x * v.x + self.y * v.y;
    };
    self.interpolate = function (v, t) {
        return v.subtract(self).scale(t).add(self);
    };
    self[Symbol.iterator] = function* () {
        yield self.x;
        yield self.y;
    };
    return self;
}
(function (Vector2) {
    function zero() {
        return Vector2(0, 0);
    }
    Vector2.zero = zero;
    function fromAngle(angle) {
        return Vector2(Math.cos(angle), Math.sin(angle));
    }
    Vector2.fromAngle = fromAngle;
})(Vector2 || (Vector2 = {}));
export function Color(r, g, b, a) {
    const self = { r, g, b, a };
    self.brightness = function (factor) {
        return Color(self.r * factor, self.g * factor, self.b * factor, self.a);
    };
    self.toStyle = function () {
        const r = Math.floor(self.r * 255);
        const g = Math.floor(self.g * 255);
        const b = Math.floor(self.b * 255);
        return `rgba(${r}, ${g}, ${b}, ${self.a})`;
    };
    self[Symbol.iterator] = function* () {
        yield self.r;
        yield self.g;
        yield self.b;
        yield self.a;
    };
    return self;
}
(function (Color) {
    function red() {
        return Color(1, 0, 0, 1);
    }
    Color.red = red;
    function blue() {
        return Color(0, 0, 1, 1);
    }
    Color.blue = blue;
    function green() {
        return Color(0, 1, 0, 1);
    }
    Color.green = green;
    function magenta() {
        return Color(1, 0, 1, 1);
    }
    Color.magenta = magenta;
    function yellow() {
        return Color(1, 1, 0, 1);
    }
    Color.yellow = yellow;
    function cyan() {
        return Color(0, 1, 1, 1);
    }
    Color.cyan = cyan;
    function white() {
        return Color(1, 1, 1, 1);
    }
    Color.white = white;
    function black() {
        return Color(0, 0, 0, 1);
    }
    Color.black = black;
})(Color || (Color = {}));
export function Entity(position, direction, movespeed) {
    const self = { position, direction, movespeed };
    return self;
}
export function PlayerEntity(position, direction) {
    const self = Entity(position, direction, DEFAULT_MOVESPEED);
    self.movingForward = false;
    self.movingBackward = false;
    self.turningLeft = false;
    self.turningRight = false;
    self.fovRange = function () {
        const l = Math.tan(FOV * 0.5) * NEAR_CLIPPING_PLANE;
        const p = self.position.add(Vector2.fromAngle(self.direction).scale(NEAR_CLIPPING_PLANE));
        const p1 = p.subtract(p.subtract(self.position).rotate90().normalize().scale(l));
        const p2 = p.add(p.subtract(self.position).rotate90().normalize().scale(l));
        return [p1, p2];
    };
    return self;
}
export function Scene(cells) {
    const self = { cells };
    self.size = function () {
        const y = self.cells.length;
        let x = Number.MIN_VALUE;
        for (const row of self.cells) {
            x = Math.max(x, row.length);
        }
        return Vector2(x, y);
    };
    return self;
}
export function Minimap(size, position) {
    const self = { size, position };
    return self;
}
export function Game(canvas, scene, player, minimap) {
    const self = {};
    self.canvas = canvas;
    self.scene = scene;
    self.canvas.width = 16 * FACTOR;
    self.canvas.height = 9 * FACTOR;
    const _ctx = canvas.getContext("2d");
    assert(_ctx !== null, "2D not supported OMEGALUL");
    self.ctx = _ctx;
    self.player = player;
    self.minimap = minimap;
    self.canvasSize = function () {
        return Vector2(self.ctx.canvas.width, self.ctx.canvas.height);
    };
    self.render = function () {
        drawBackground("#181818");
        renderScene();
        renderMinimap();
    };
    function drawCircle(p, fillStyle, radius) {
        self.ctx.fillStyle = fillStyle;
        self.ctx.beginPath();
        //@ts-ignore
        self.ctx.arc(...p, radius, 0, Math.PI * 2);
        self.ctx.fill();
    }
    function drawLine(p1, p2, strokeStyle, lineWidth) {
        self.ctx.strokeStyle = strokeStyle;
        self.ctx.lineWidth = lineWidth;
        self.ctx.beginPath();
        //@ts-ignore
        self.ctx.moveTo(...p1);
        //@ts-ignore
        self.ctx.lineTo(...p2);
        self.ctx.stroke();
    }
    function drawRect(color, x, y, w, h) {
        self.ctx.fillStyle = color;
        self.ctx.fillRect(x, y, w, h);
    }
    function drawBackground(fillStyle) {
        self.ctx.fillStyle = fillStyle;
        self.ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);
    }
    function drawMinimapGrid(strokeStyle, lineWidth) {
        for (let x = 0; x <= self.scene.size().x; x++) {
            drawLine(Vector2(x, 0), Vector2(x, self.scene.size().y), strokeStyle, lineWidth);
        }
        for (let y = 0; y <= self.scene.size().y; y++) {
            drawLine(Vector2(0, y), Vector2(self.scene.size().x, y), strokeStyle, lineWidth);
        }
    }
    function drawMinimapWalls() {
        for (let y = 0; y < self.scene.size().y; y++) {
            for (let x = 0; x < self.scene.size().x; x++) {
                const cell = self.scene.cells[y][x];
                if (cell !== null) {
                    if (cell instanceof HTMLImageElement) {
                        self.ctx.drawImage(cell, x, y, 1, 1);
                    }
                    else {
                        drawRect(cell.toStyle(), x, y, 1, 1);
                    }
                }
            }
        }
    }
    function renderMinimap() {
        self.ctx.save();
        // @ts-ignore
        self.ctx.translate(...self.minimap.position);
        // @ts-ignore
        self.ctx.scale(...self.minimap.size.divide(self.scene.size()));
        // @ts-ignore
        drawRect("#181818", 0, 0, ...self.scene.size());
        drawMinimapWalls();
        drawMinimapGrid("#303030", 0.05);
        drawCircle(self.player.position, "magenta", 0.2);
        const [p1, p2] = self.player.fovRange();
        drawLine(p1, p2, "magenta", 0.1);
        drawLine(self.player.position, p1, "magenta", 0.1);
        drawLine(self.player.position, p2, "magenta", 0.1);
        self.ctx.restore();
    }
    function renderScene() {
        const stripWidth = Math.ceil(self.ctx.canvas.width / SCREEN_WIDTH);
        const [r1, r2] = self.player.fovRange();
        for (let x = 0; x < SCREEN_WIDTH; x++) {
            const p = castRay(self.scene, self.player.position, r1.interpolate(r2, x / SCREEN_WIDTH));
            const c = getHittingCellPos(self.player.position, p);
            if (isPointInSceneBounds(self.scene, c)) {
                const cell = self.scene.cells[c.y][c.x];
                if (cell !== null) {
                    const v = p.subtract(self.player.position);
                    const d = Vector2.fromAngle(self.player.direction);
                    const stripHeight = self.canvas.height / v.dotProduct(d);
                    if (cell instanceof HTMLImageElement) {
                        const t = p.subtract(c);
                        let u = 0;
                        if ((Math.abs(t.x) < EPS || Math.abs(t.x - 1) < EPS) && t.y > 0) {
                            u = t.y;
                        }
                        else {
                            u = t.x;
                        }
                        self.ctx.drawImage(cell, u * cell.width, 0, 1, cell.height, x * stripWidth, (self.canvas.height - stripHeight) * 0.5, stripWidth, stripHeight);
                    }
                    else {
                        drawRect(cell.brightness(1 / v.dotProduct(d)).toStyle(), x * stripWidth, (self.canvas.height - stripHeight) * 0.5, stripWidth, stripHeight);
                    }
                }
            }
        }
    }
    return self;
}
function rayStep(p1, p2) {
    const d = p2.subtract(p1);
    let p3 = p2;
    if (d.x !== 0) {
        const k = d.y / d.x;
        const c = p1.y - k * p1.x;
        {
            const x3 = snap(p2.x, d.x);
            const y3 = x3 * k + c;
            const p3x = Vector2(x3, y3);
            p3 = p3x;
        }
        if (k !== 0) {
            const y3 = snap(p2.y, d.y);
            const x3 = (y3 - c) / k;
            const p3y = Vector2(x3, y3);
            if (p2.sqrDistanceTo(p3y) < p2.sqrDistanceTo(p3)) {
                p3 = p3y;
            }
        }
    }
    else {
        const y3 = snap(p2.y, d.y);
        const x3 = p2.x;
        p3 = Vector2(x3, y3);
    }
    return p3;
}
function getHittingCellPos(p1, p2) {
    const d = p2.subtract(p1);
    return Vector2(Math.floor(p2.x + Math.sign(d.x) * EPS), Math.floor(p2.y + Math.sign(d.y) * EPS));
}
function snap(x, dx) {
    return dx > 0 ? Math.ceil(x + Math.sign(dx) * EPS) : dx < 0 ? Math.floor(x + Math.sign(dx) * EPS) : x;
}
function isPointInSceneBounds(scene, p) {
    const size = scene.size();
    return 0 <= p.x && p.x < size.x && 0 <= p.y && p.y < size.y;
}
function castRay(scene, p1, p2) {
    const start = p1;
    while (start.sqrDistanceTo(p1) < FAR_CLIPPING_PLANE * FAR_CLIPPING_PLANE) {
        const c = getHittingCellPos(p1, p2);
        if (isPointInSceneBounds(scene, c) && scene.cells[c.y][c.x] !== null)
            break;
        const p3 = rayStep(p1, p2);
        p1 = p2;
        p2 = p3;
    }
    return p2;
}
//# sourceMappingURL=game.js.map