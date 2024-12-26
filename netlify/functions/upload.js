const busboy = require('busboy');
const fs = require('fs');
const path = require('path');

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
    const tmpDir = '/tmp';

    bb.on('file', (fieldname, file, filename) => {
      const savePath = path.join(tmpDir, filename);
      const writeStream = fs.createWriteStream(savePath);
      file.pipe(writeStream);
      uploads.push(savePath);

      writeStream.on('close', () => {
        resolve({
          statusCode: 200,
          body: JSON.stringify({
            message: 'File uploaded successfully',
            filePath: uploads,
          }),
        });
      });
    });

    bb.on('error', err => {
      reject({
        statusCode: 500,
        body: JSON.stringify({ message: 'Error uploading file', error: err.message }),
      });
    });

    bb.end(Buffer.from(event.body, 'base64'));
  });
};
