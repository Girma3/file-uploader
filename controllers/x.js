const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { fileURLToPath } = require("url");
const dirname = path.dirname;

const supabase = createClient(
  "https://your-supabase-url.supabase.co",
  "your-supabase-api-key"
);

async function handleUpload(req, res) {
  try {
    const uploads = req.files || [req.file]; // Handles both single and array uploads
    const uploaderDir = path.join(
      dirname(fileURLToPath(import.meta.url)),
      "../"
    );
    const uploadDir = path.join(uploaderDir, "uploads");

    const uploadPromises = uploads.map(async (file) => {
      const filePath = path.join(uploadDir, file.filename);

      // Check if it's part of a folder or a single file
      const destinationPath = file.originalname.includes("/")
        ? `my-folders/${file.originalname}` // Place in "my folders" for folder contents
        : `files/${file.filename}`; // Place in "files" for single files

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from("your-bucket-name")
        .upload(destinationPath, fs.createReadStream(filePath), {
          cacheControl: "3600",
          upsert: false,
          contentType: file.mimetype,
        });

      if (error) throw error;

      return { path: destinationPath, supabaseData: data }; // Return Supabase upload result
    });

    const results = await Promise.all(uploadPromises);

    // Delete local files after successful upload
    uploads.forEach((file) => {
      const filePath = path.join(uploadDir, file.filename);
      fs.unlinkSync(filePath); // Remove local file
    });

    res
      .status(200)
      .json({
        message: "Files and folders uploaded successfully to Supabase!",
        results,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading files/folders", error });
  }
}
