Bun.serve({
    port: 3000,
    fetch(request) {
        const url = new URL(request.url)
        let res: Response

        switch (url.pathname) {
            // case "/":
            //     {
            //         res = new Response(Bun.file("./index.html"), {
            //             headers: { "Content-Type": "text/html" },
            //         })
            //     }
            //     break
            default: {
                res = new Response("Not Found", {
                    status: 404,
                    statusText: "Not Found",
                    headers: { "Content-Type": "text/plain" },
                })
            }
        }

        return res
    },
})

console.log("Server is running on http://localhost:3000")

