import multer from 'multer';

const storage = multer.memoryStorage();

// Accept only image and video files
const fileFilter = (req, file, cb) => {
    const allowed = /^(image|video)\//;
    if (allowed.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
};

// 50MB limit covers high-res reels; images will be far smaller
const uploadFile = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 },
}).single("file");

export default uploadFile;