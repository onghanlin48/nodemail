const AWS = require("aws-sdk");
const multiparty = require("multiparty");
const { v4: uuidv4 } = require("uuid");

// Configure AWS S3 for the Singapore region
const S3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-southeast-1", // Singapore region
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const form = new multiparty.Form();
    const data = await new Promise((resolve, reject) => {
      form.parse(event, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const file = files.file[0]; // Get the uploaded file
    const fileContent = require("fs").readFileSync(file.path);

    // Create a unique name for the file
    const fileName = `${uuidv4()}.pdf`;

    // Upload the file to S3
    const params = {
      Bucket: process.env.S3_BUCKET_NAME, // Your bucket name
      Key: fileName,
      Body: fileContent,
      ContentType: "application/pdf",
    };

    const uploadResult = await S3.upload(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded successfully",
        url: uploadResult.Location, // S3 URL
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
