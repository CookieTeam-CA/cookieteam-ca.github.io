const MAX_IMAGES = 256;
const MAX_AGE = 5 * 60 * 1000;
const images = new Map<string, { promise: Promise<HTMLImageElement>; expires: number }>();

// Keep decoded images across viewer disposal, without retaining WebGL resources.
export function loadTextureImage(url: string): Promise<HTMLImageElement> {
    const cached = images.get(url);
    if (cached && cached.expires > Date.now()) {
        images.delete(url);
        images.set(url, cached);
        return cached.promise;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    const promise = image.decode().then(() => image).catch(error => {
        if (images.get(url)?.promise === promise) images.delete(url);
        throw error;
    });
    images.delete(url);
    images.set(url, { promise, expires: Date.now() + MAX_AGE });
    if (images.size > MAX_IMAGES) images.delete(images.keys().next().value!);
    return promise;
}
