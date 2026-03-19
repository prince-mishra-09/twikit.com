import { getOptimizedImage } from "./imagekitUtils";

export const getOptimizedImg = (url, width, height) => {
    return getOptimizedImage(url, { width, height });
};
