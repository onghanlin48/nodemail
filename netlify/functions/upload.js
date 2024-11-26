const fs = require('fs');
const path = require('path');
const formidable = require('formidable'); // We can use `formidable` for parsing form data (included in Netlify Lambda by default)
const { parse } = require('querystring');

exports.handler = async (event, context) => {
  return new Promise((resolve, reject) => {
    // Initialize the formidable form
    const form = new formidable.IncomingForm();
    
    // Define the directory where the file will be saved
    form.uploadDir = path.join(__dirname, '../uploads');
    form.keepExtensions = true; // Keep file extensions

    // Ensure the directory exists
    const targetDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }

    // Parse the incoming request
    form.parse(event.body, async (err, fields, files) => {
      if (err) {
        reject({
          statusCode: 400,
          body: JSON.stringify({ message: 'Error parsing form data', error: err }),
        });
        return;
      }

      const file = files.file[0];
      const filename = fields.filename || file.originalFilename;

      // Define the file path and save it
      const filePath = path.join(form.uploadDir, filename);

      fs.renameSync(file.filepath, filePath);

      resolve({
        statusCode: 200,
        body: JSON.stringify({
          message: 'File uploaded successfully',
          filename: filename,
          filePath: filePath,
        }),
      });
    });
  });
};
