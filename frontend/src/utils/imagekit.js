export const getOptimizedImg = (url, width, height) => {
    if (!url) return "";

    // ImageKit should be the primary provider now.
    // If it's not an ImageKit URL, we return it as is, but we'll assume most are.
    if (!url.includes("ik.imagekit.io") && !url.includes("ik.imgkit.net")) return url;

    // Check if already optimized
    if (url.includes("tr:") || url.includes("tr=")) return url;

    // Build transformation string
    let transforms = ["f-auto", "q-auto"];
    if (width) transforms.push(`w-${width}`);
    if (height) transforms.push(`h-${height}`);
    if (width || height) transforms.push("c-at_max");

    const trString = `tr:${transforms.join(",")}`;

    try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split("/").filter(Boolean);

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
