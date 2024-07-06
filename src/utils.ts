export function unreachable(msg: string): never {
    throw new Error(msg)
}

export function assert(condition: boolean, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message)
    }
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
    const img = new Image()
    img.src = src

    return new Promise((resolve, reject) => {
        img.onload = () => {
            resolve(img)
        }
        img.onerror = reject
    })
}
export async function loadImageData(src: string): Promise<ImageData> {
    const img = await loadImage(src)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    assert(ctx !== null, "wtf is this browser dude cmon")
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    return ctx.getImageData(0, 0, img.width, img.height)
}
