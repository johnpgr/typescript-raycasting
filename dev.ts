// @ts-ignore
import index from "./src/index.html" with { type: "text" }
import { ServerWebSocket } from "bun"
import { readdir } from "fs/promises"
import { watchFile } from "fs"

const [assets, dist, src] = await Promise.all([
    readdir("assets", { recursive: true }).then((a) => a.map((v) => "assets/" + v)),
    readdir("dist"),
    readdir("src").then((a) => a.map((v) => "src/" + v)),
])

function cmd(command: string, ...args: string[]) {
    console.log("CMD:", command, args)

    Bun.spawn([command, ...args], {
        stdout: "inherit",
        stderr: "inherit",
        onExit(_, exitCode) {
            if (exitCode) {
                if (exitCode !== 0) {
                    console.error(`Command '${command}' exited with code ${exitCode}`)
                }
            }
        },
    })
}

export const httpServer = (port: number) => {
    const server = Bun.serve({
        port,
        fetch(request) {
            if (request.method !== "GET") {
                return new Response("Method Not Allowed", {
                    status: 405,
                    statusText: "Method Not Allowed",
                    headers: { "Content-Type": "text/plain" },
                })
            }

            const url = new URL(request.url)

            if (url.pathname === "/") {
                return new Response(index, {
                    headers: { "Content-Type": "text/html" },
                })
            } else {
                let path = url.pathname.slice(1)
                if (path.endsWith("/")) {
                    path = path.slice(0, -1)
                }

                if (dist.includes(path)) {
                    const file = Bun.file(`./dist/${path}`)

                    // directory or binary file
                    if (file.type === "application/octet-stream") {
                        return new Response("Not Found", {
                            status: 404,
                            headers: { "Content-Type": "text/plain" },
                        })
                    }

                    return new Response(file, {
                        headers: {
                            "Content-Type": file.type,
                        },
                    })
                }
                // For when clicking in error stacktrace w/ the mapped source in the browser
                else if (src.includes(path)) {
                    const file = Bun.file(path)

                    // directory or binary file
                    if (file.type === "application/octet-stream") {
                        return new Response("Not Found", {
                            status: 404,
                            headers: { "Content-Type": "text/plain" },
                        })
                    }

                    return new Response(file, {
                        headers: {
                            "Content-Type": file.type,
                        },
                    })
                } else if (assets.includes(path)) {
                    const file = Bun.file(path)

                    // directory or binary file
                    if (file.type === "application/octet-stream") {
                        return new Response("Not Found", {
                            status: 404,
                            headers: { "Content-Type": "text/plain" },
                        })
                    }

                    return new Response(file, {
                        headers: { "Content-Type": file.type },
                    })
                }
            }

            return new Response("Not Found", {
                status: 404,
                statusText: "Not Found",
                headers: { "Content-Type": "text/plain" },
            })
        },
    })

    console.log(`HTTP: Listening on ${server.hostname}:${server.port}`)

    return server
}

export const wsServer = (port: number) => {
    const sockets = new Set<ServerWebSocket<unknown>>()

    const server = Bun.serve({
        port,
        fetch(req, server) {
            const success = server.upgrade(req)

            if (success) {
                // Bun automatically returns a 101 Switching Protocols
                // if the upgrade succeeds
                return undefined
            }

            // handle HTTP request normally
            return new Response("Hello world!")
        },
        websocket: {
            open(ws) {
                console.log(`connection opened: ${ws.remoteAddress}`)
                sockets.add(ws)
            },
            close(ws, code, reason) {
                console.log(`connection closed: ${ws.remoteAddress} code: ${code} reason: ${reason}`)
                sockets.delete(ws)
            },
            async message(ws, message) {
                console.log(`Received ${message} from ${ws.remoteAddress}`)
                ws.send(`You said: ${message}`)
            },
        },
    })

    console.log(`WSS: Listening on ${server.hostname}:${server.port}`)

    return [server, sockets] as const
}

const [, sockets] = wsServer(3001)
httpServer(3000)
cmd("tsc", "--sourceMap", "-w")

const COLD_RELOAD_FILES = ["index.ts", "index.html", "consts.ts", "utils.ts"]
const HOT_RELOAD_FILES = ["game.ts"]

COLD_RELOAD_FILES.forEach((file) => {
    watchFile(`src/${file}`, { interval: 50 }, () => {
        console.log("Cold reloading")
        sockets.forEach((ws) => ws.send("cold"))
    })
})
HOT_RELOAD_FILES.forEach((file) => {
    watchFile(`src/${file}`, { interval: 50 }, () => {
        console.log("Hot reloading")
        sockets.forEach((ws) => ws.send("hot"))
    })
})
