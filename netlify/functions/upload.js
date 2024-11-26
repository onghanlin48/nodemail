const path = require("path");
const fs = require("fs");
const { createWriteStream } = require("fs");
const { tmpdir } = require("os");
const Busboy = require("busboy");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  return new Promise((resolve) => {
    const busboy = new Busboy({ headers: event.headers });
    const uploads = [];
    let newFileName = "";

    busboy.on("file", (fieldname, file, filename) => {
      const extension = path.extname(filename);
      const uploadPath = path.join(tmpdir(), filename);

      // Save the uploaded file
      const stream = createWriteStream(uploadPath);
      file.pipe(stream);
      uploads.push({ path: uploadPath, extension });
    });

    busboy.on("field", (fieldname, value) => {
      if (fieldname === "newName") {
        newFileName = value.trim();
      }
    });

    busboy.on("finish", () => {
      if (uploads.length === 0 || !newFileName) {
        resolve({ statusCode: 400, body: "File and new name are required" });
        return;
      }

      // Rename the file
      const uploadedFile = uploads[0];
      const newFilePath = path.join(tmpdir(), `${newFileName}${uploadedFile.extension}`);
      fs.rename(uploadedFile.path, newFilePath, (err) => {
        if (err) {
          console.error("Error renaming file:", err);
          resolve({ statusCode: 500, body: "Error renaming file" });
          return;
        }

        resolve({ statusCode: 200, body: `File renamed to: ${newFileName}${uploadedFile.extension}` });
      });
    });

    busboy.end(Buffer.from(event.body, "base64"));
  });
};
