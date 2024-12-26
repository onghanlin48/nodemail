const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  const form = new formidable.IncomingForm();
  form.parse(event, (err, fields, files) => {
    if (err) {
      return { statusCode: 500, body: JSON.stringify({ message: 'Error parsing form' }) };
    }
    const uploadedFile = files.pdf[0]; // Access the uploaded PDF file
    const filePath = path.join(__dirname, 'uploads', uploadedFile.originalFilename);
    
    // Save file to server directory
    fs.renameSync(uploadedFile.filepath, filePath);

    return { statusCode: 200, body: JSON.stringify({ message: 'File uploaded', filePath }) };
  });
};
