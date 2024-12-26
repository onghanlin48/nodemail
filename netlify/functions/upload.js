const busboy = require('busboy');
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: { 'content-type': event.headers['content-type'] } });
    const tmpDir = '/tmp';
    const uploads = [];

    bb.on('file', (fieldname, file, filename) => {
      const filePath = path.join(tmpDir, filename);
      const writeStream = fs.createWriteStream(filePath);
      file.pipe(writeStream);
      uploads.push(filePath);

      writeStream.on('close', () => {
        console.log(`Uploaded file: ${filePath}`);
      });
    });

    bb.on('finish', () => {
      resolve({
        statusCode: 200,
        body: JSON.stringify({
          message: 'File uploaded successfully',
          files: uploads,
        }),
      });
    });

    bb.on('error', (err) => {
      reject({
        statusCode: 500,
        body: JSON.stringify({ message: 'Upload error', error: err.message }),
      });
    });

    bb.end(Buffer.from(event.body, 'base64'));
  });
};
