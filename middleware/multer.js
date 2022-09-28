const multer = require("multer");
const path = require("path");

module.exports = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".wav" && ext !== ".mp3" && ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext != '.webp') {
      req.fileValidationError = true;
      //cb(new Error("File type is not supported"), false);
      return cb(null,false, new Error('Unsupported filetype.'))
    }
    cb(null, true);
  },
});
