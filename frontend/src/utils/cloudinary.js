export const getOptimizedImg = (url, width, height) => {
    if (!url) return "";

    // Check if it's a Cloudinary URL
    if (!url.includes("cloudinary.com")) return url;

    // Check if it's already optimized (contains f_auto,q_auto) - simple check
    if (url.includes("f_auto,q_auto")) return url;

    // Construct transformation string
    let transformations = "f_auto,q_auto";
    if (width) transformations += `,w_${width}`;
    if (height) transformations += `,h_${height}`;
    if (width || height) transformations += ",c_fill"; // ensuring crop fill if resizing

    // Inject transformations found "/upload/"
    return url.replace("/upload/", `/upload/${transformations}/`);
};
