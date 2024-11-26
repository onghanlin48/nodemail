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
  let fileType = null;

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

          // Determine the file type based on extension
          if ([".jpg", ".jpeg", ".png", ".gif"].includes(fileExtension.toLowerCase())) {
            fileType = "image";
          } else if ([".pdf"].includes(fileExtension.toLowerCase())) {
            fileType = "pdf";
          }

          // Create the directory for the file if it doesn't exist
          if (fileType === "image") {
            const imageDir = path.join(tmpdir(), "image");
            if (!fs.existsSync(imageDir)) {
              fs.mkdirSync(imageDir);
            }

            // Subdirectories based on your requirement (ic or c)
            const subDir = "ic"; // Modify this dynamically based on your logic
            const dirPath = path.join(imageDir, subDir);
            if (!fs.existsSync(dirPath)) {
              fs.mkdirSync(dirPath);
            }

            filePath = path.join(dirPath, originalFilename);
          } else if (fileType === "pdf") {
            const pdfDir = path.join(tmpdir(), "pdf");
            if (!fs.existsSync(pdfDir)) {
              fs.mkdirSync(pdfDir);
            }

            const pdfSubDir = "c"; // Modify this dynamically based on your logic
            const pdfDirPath = path.join(pdfDir, pdfSubDir);
            if (!fs.existsSync(pdfDirPath)) {
              fs.mkdirSync(pdfDirPath);
            }

            filePath = path.join(pdfDirPath, originalFilename);
          }

          // Save the file
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

  // Rename the file if it exists
  const fileExtension = path.extname(filePath);
  const newFilePath = path.join(path.dirname(filePath), `${newFileName}${fileExtension}`);

  try {
    fs.renameSync(filePath, newFilePath);
    return { statusCode: 200, body: `File renamed to: ${newFileName}${fileExtension}` };
  } catch (err) {
    console.error("Error renaming file:", err);
    return { statusCode: 500, body: "Error renaming file" };
  }
};
