const busboy = require('busboy');
const path = require('path');
const fs = require('fs');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: { 'content-type': event.headers['content-type'] } });
    const uploads = [];

    bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
      if (mimetype !== 'application/pdf') {
        return reject({
          statusCode: 400,
          body: JSON.stringify({ message: 'Only PDF files are allowed' }),
        });
      }

      const savePath = path.join('/tmp', filename);
      const writeStream = fs.createWriteStream(savePath);
      file.pipe(writeStream);
      uploads.push({ fieldname, filename, savePath });

      writeStream.on('close', () => {
        resolve({
          statusCode: 200,
          body: JSON.stringify({
            message: 'File uploaded successfully',
            filePath: savePath,
          }),
        });
      });
    });

    bb.on('error', err => {
      reject({
        statusCode: 500,
        body: JSON.stringify({ message: 'Error processing file upload', error: err.message }),
      });
    });

    bb.end(Buffer.from(event.body, 'base64'));
  });
};
