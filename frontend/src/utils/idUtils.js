/**
 * Robustly compare two IDs that might be strings or MongoDB ObjectId-like objects
 */
export const isSameId = (id1, id2) => {
    if (!id1 || !id2) return false;

    const s1 = typeof id1 === 'object' ? (id1._id || id1).toString() : id1.toString();
    const s2 = typeof id2 === 'object' ? (id2._id || id2).toString() : id2.toString();

    return s1 === s2;
};

/**
 * Robustly check if an ID exists in an array of IDs
 */
export const includesId = (array, id) => {
    if (!array || !id) return false;
    return array.some(item => isSameId(item, id));
};
