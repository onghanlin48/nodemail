const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, 'uploads');  // Ensure upload directory exists
  form.keepExtensions = true;  // Keep file extension
  form.parse(event, (err, fields, files) => {
    if (err) {
      console.log("Error parsing form:", err);
      return { statusCode: 500, body: JSON.stringify({ message: 'Error parsing form' }) };
    }

    const uploadedFile = files.pdf[0]; // PDF file in the form data
    if (!uploadedFile) {
      return { statusCode: 400, body: JSON.stringify({ message: 'No PDF file found in request' }) };
    }

    const filePath = path.join(__dirname, 'uploads', uploadedFile.originalFilename);

    // Ensure the upload directory exists
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    // Move the file
    fs.renameSync(uploadedFile.filepath, filePath);

    console.log("File uploaded:", filePath);

    return { statusCode: 200, body: JSON.stringify({ message: 'File uploaded successfully', filePath }) };
  });
};
