const multer = require("multer");
const { v4: uuid } = require("uuid");
const mime = require("mime-types");
const { s3Client } = require("../aws");
const multerS3 = require("multer-s3");

// show_id에 따른 공연, 전시 이미지 저장
const uploadShowImg = (fields) => {
  return multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_S3_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (req, file, cb) {
        const extension = mime.extension(file.mimetype);
        cb(null, `show/${uuid()}.${extension}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type, only JPEG, PNG, and JPG are allowed!"), false);
      }
    },
    limits: {
      fileSize: 1024 * 1024 * 5, // 5 MB
    },
  }).fields(fields);
};

// story 이미지 저장
const uploadStoryImg = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const extension = mime.extension(file.mimetype);
      cb(null, `story/${uuid()}.${extension}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type, only JPEG, PNG, and JPG are allowed!"), false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB
  },
});

module.exports = { uploadShowImg, uploadStoryImg };
