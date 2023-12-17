const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../aws");

const deleteFileFromS3 = async (fileKey) => {
  const deleteParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileKey,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log("Delete Success", fileKey);
    // 삭제 성공 처리
  } catch (err) {
    console.error("Error", err);
    // 에러 처리
  }
};

module.exports = { deleteFileFromS3 };
