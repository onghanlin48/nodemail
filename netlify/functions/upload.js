exports.handler = async function(event, context) {
  try {
    const form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, 'uploads');
    form.keepExtensions = true;

    // Parse the form
    form.parse(event, (err, fields, files) => {
      if (err) {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Error parsing form' }),
        };
      }

      const uploadedFile = files.pdf[0];
      if (!uploadedFile) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'No PDF file found in request' }),
        };
      }

      const filePath = path.join(__dirname, 'uploads', uploadedFile.originalFilename);
      // Ensure the upload directory exists
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      // Move the file
      fs.renameSync(uploadedFile.filepath, filePath);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'File uploaded successfully',
          filePath: filePath,
        }),
      };
    });
  } catch (error) {
    console.log("Error occurred:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error' }),
    };
  }
};
