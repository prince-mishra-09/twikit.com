export const getOptimizedImg = (url, width, height) => {
    if (!url) return "";

    // Check if it's an ImageKit URL
    if (!url.includes("ik.imagekit.io") && !url.includes("ik.imgkit.net")) return url;

    // Check if already optimized
    if (url.includes("tr:") || url.includes("tr=")) return url;

    // Build transformation string
    let transforms = ["f-auto", "q-auto"];
    if (width) transforms.push(`w-${width}`);
    if (height) transforms.push(`h-${height}`);
    if (width || height) transforms.push("c-at_max");

    const trString = `tr:${transforms.join(",")}`;

    // ImageKit URL format: https://ik.imagekit.io/your_id/path/image.jpg
    // Insert transformation after the URL endpoint
    // Result: https://ik.imagekit.io/your_id/tr:f-auto,q-auto/path/image.jpg
    try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split("/").filter(Boolean);
        // pathSegments[0] is the imagekit_id, rest is the file path
        if (pathSegments.length >= 2) {
            const ikId = pathSegments[0];
            const filePath = pathSegments.slice(1).join("/");
            urlObj.pathname = `/${ikId}/${trString}/${filePath}`;
        }
        return urlObj.toString();
    } catch {
        return url;
    }
};
