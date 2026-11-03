import { Router } from 'express';
import multer from 'multer';
import { uploadImageBuffer, uploadVideoBuffer } from '../../services/cloudinary.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

function createUpload(prefix: string, maxSize: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxSize,
    },
    fileFilter: (_req, file, callback) => {
      if (!file.mimetype.startsWith(prefix)) {
        callback(
          AppError.badRequest(
            prefix === 'image/' ? 'Only image files are allowed' : 'Only video files are allowed',
          ),
        );
        return;
      }

      callback(null, true);
    },
  });
}

const imageUpload = createUpload('image/', MAX_IMAGE_SIZE);
const videoUpload = createUpload('video/', MAX_VIDEO_SIZE);

export const uploadRouter = Router();

uploadRouter.post(
  '/image',
  imageUpload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw AppError.badRequest('Image file is required');
    }

    const image = await uploadImageBuffer(req.file.buffer);

    res.status(201).json({ image });
  }),
);

uploadRouter.post(
  '/video',
  videoUpload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw AppError.badRequest('Video file is required');
    }

    const video = await uploadVideoBuffer(req.file.buffer);

    res.status(201).json({ video });
  }),
);
