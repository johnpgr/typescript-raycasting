export function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
export async function loadImage(src) {
    const img = new Image();
    img.src = src;
    return new Promise((resolve, reject) => {
        img.onload = () => {
            resolve(img);
        };
        img.onerror = reject;
    });
}
export async function loadImageData(src) {
    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    assert(ctx !== null, "wtf is this browser dude cmon");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
}
//# sourceMappingURL=utils.js.map