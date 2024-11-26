const path = require("path");
const fs = require("fs");

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
  let directory = null;

  // Log parts to help with debugging
  console.log(parts); // Add this for debugging

  // Process each part of the multipart form data
  for (const part of parts) {
    if (part.includes("Content-Disposition")) {
      const disposition = part.split("\r\n")[0];
      const content = part.split("\r\n\r\n")[1];

      console.log("Disposition:", disposition);
      console.log("Content:", content); // Log extracted content

      if (disposition.includes("filename")) {
        // Extract the original filename
        const filenameMatch = disposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          console.log("Extracted filename:", filenameMatch[1]);
          const originalFilename = filenameMatch[1];
          const fileExtension = path.extname(originalFilename);

          // Temporarily save the file
          filePath = path.join("/tmp", originalFilename);
          fs.writeFileSync(filePath, content, "binary");
        }
      } else if (disposition.includes('name="newName"')) {
        // Extract the new file name
        newFileName = content.trim();
      } else if (disposition.includes('name="directory"')) {
        // Extract the directory
        directory = content.trim();
      }
    }
  }

  if (!filePath || !newFileName || !directory) {
    return { statusCode: 400, body: "File, new name, and directory are required" };
  }

  // Create the directory if it doesn't exist
  const finalDirPath = path.join("uploads", directory);
  if (!fs.existsSync(finalDirPath)) {
    fs.mkdirSync(finalDirPath, { recursive: true });
  }

  const finalFilePath = path.join(finalDirPath, `${newFileName}${path.extname(filePath)}`);

  // Move and rename the file
  try {
    fs.renameSync(filePath, finalFilePath);
    return { statusCode: 200, body: `File saved to: ${finalFilePath}` };
  } catch (err) {
    console.error("Error saving file:", err);
    return { statusCode: 500, body: "Error saving file" };
  }
};
