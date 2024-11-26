const path = require("path");
const fs = require("fs");
const { tmpdir } = require("os");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const contentType = event.headers["content-type"] || event.headers["Content-Type"];
  if (!contentType || !contentType.startsWith("multipart/form-data")) {
    return { statusCode: 400, body: "Invalid content type" };
  }

  // Extract the boundary from the Content-Type header
  const boundary = contentType.split("boundary=")[1];
  if (!boundary) {
    return { statusCode: 400, body: "No boundary in multipart/form-data" };
  }

  const body = Buffer.from(event.body, "base64");
  const parts = body.toString("binary").split(`--${boundary}`);

  let filePath = null;
  let newFileName = null;

  for (const part of parts) {
    if (part.includes("Content-Disposition")) {
      const disposition = part.split("\r\n")[0];
      const content = part.split("\r\n\r\n")[1];
      if (disposition.includes("filename")) {
        // Extract the original filename
        const filenameMatch = disposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          const originalFilename = filenameMatch[1];
          const fileExtension = path.extname(originalFilename);

          // Save the file to a temporary directory
          filePath = path.join(tmpdir(), originalFilename);
          fs.writeFileSync(filePath, content, "binary");

          console.log("Uploaded file saved at:", filePath);
        }
      } else if (disposition.includes("name=\"newName\"")) {
        // Extract the new file name
        newFileName = content.trim();
      }
    }
  }

  if (!filePath || !newFileName) {
    return { statusCode: 400, body: "File and new name are required" };
  }

  // Rename the file
  const fileExtension = path.extname(filePath);
  const newFilePath = path.join(tmpdir(), `${newFileName}${fileExtension}`);

  try {
    fs.renameSync(filePath, newFilePath);
    return { statusCode: 200, body: `File renamed to: ${newFileName}${fileExtension}` };
  } catch (err) {
    console.error("Error renaming file:", err);
    return { statusCode: 500, body: "Error renaming file" };
  }
};
