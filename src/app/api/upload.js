// pages/api/upload.js
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const multer = require('multer');
    const upload = multer({
      storage: multer.diskStorage({
        destination: async function (req, file, cb) {
          const dir = path.join(process.cwd(), 'public', 'property');
          await fs.mkdir(dir, { recursive: true });
          cb(null, dir);
        },
        filename: function (req, file, cb) {
          const ext = path.extname(file.originalname);
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
    });

    upload.array('images')(req, res, function (err) {
      if (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: 'Error uploading files' });
      }

      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const urls = files.map(file => `/property/${file.filename}`);
      res.status(200).json({ urls });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}