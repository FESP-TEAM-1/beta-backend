const multer = require("multer");
const { v4: uuid } = require("uuid");
const mime = require("mime-types");
const multerS3 = require("multer-s3");
const { s3 } = require("../aws");

// 서버에 이미지 저장 로직
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "./images"),
//   filename: (req, file, cb) => {
//     const extension = mime.extension(file.mimetype);
//     cb(null, `${uuid()}.${extension}`);
//   },
// });

// AWS S3에 이미지 저장 로직
const storage = multerS3({
  s3,
  bucket: "beta-s3-bucket",
  key: (req, file, cb) => {
    const extension = mime.extension(file.mimetype);
    cb(null, `${uuid()}.${extension}`); // 만약 폴더 안에 저장하고 싶다면, `${folderName}/${uuid()}.${extension}`
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type, only JPEG and PNG is allowed!"), false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 3,
  },
});

module.exports = { upload };
