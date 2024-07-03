// @ts-ignore
import index from "./index.html" with { type: "text" }
import { readdir } from "fs/promises"

const assets = await readdir("assets", { recursive: true })
const src = await readdir(".")

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

                if (src.includes(path)) {
                    const file = Bun.file(`./${path}`)

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
                    const file = Bun.file(`./assets/${path}`)

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
    const server = Bun.serve<{ authToken: string }>({
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
            // this is called when a message is received
            async message(ws, message) {
                console.log(`Received ${message}`)
                // send back a message
                ws.send(`You said: ${message}`)
            },
        },
    })

    console.log(`WSS: Listening on ${server.hostname}:${server.port}`)

    return server
}

httpServer(3000)
// wsServer(3001)
cmd("tsc", "-w")
