const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadFile, uploadBuffer } = require('./cloudinaryConfig');
const logger = require('../logger');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Configure multer memory storage for direct buffer uploads
const memoryStorage = multer.memoryStorage();

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  // Accept images, videos, and documents
  const allowedFileTypes = /jpeg|jpg|png|gif|webp|mp4|mp3|pdf|doc|docx|xls|xlsx|ppt|pptx/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create multer memory upload instance
const memoryUpload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Middleware to upload files to Cloudinary after multer processes them
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return next();
    }
    
    // Handle single file upload
    if (req.file) {
      const result = await uploadFile(req.file.path, {
        folder: req.body.folder || 'amazon-clone',
        resource_type: getResourceType(req.file.mimetype)
      });
      
      // Add Cloudinary result to request
      req.cloudinaryResult = result;
      
      // Delete local file
      fs.unlinkSync(req.file.path);
    }
    
    // Handle multiple files upload
    if (req.files) {
      const cloudinaryResults = [];
      
      for (const file of Object.values(req.files).flat()) {
        const result = await uploadFile(file.path, {
          folder: req.body.folder || 'amazon-clone',
          resource_type: getResourceType(file.mimetype)
        });
        
        cloudinaryResults.push(result);
        
        // Delete local file
        fs.unlinkSync(file.path);
      }
      
      // Add Cloudinary results to request
      req.cloudinaryResults = cloudinaryResults;
    }
    
    next();
  } catch (error) {
    logger.error(`Error uploading to Cloudinary: ${error.message}`);
    next(error);
  }
};

/**
 * Middleware to upload files directly to Cloudinary from memory
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const uploadBufferToCloudinary = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return next();
    }
    
    // Handle single file upload
    if (req.file) {
      const result = await uploadBuffer(req.file.buffer, {
        folder: req.body.folder || 'amazon-clone',
        resource_type: getResourceType(req.file.mimetype)
      });
      
      // Add Cloudinary result to request
      req.cloudinaryResult = result;
    }
    
    // Handle multiple files upload
    if (req.files) {
      const cloudinaryResults = [];
      
      for (const file of Object.values(req.files).flat()) {
        const result = await uploadBuffer(file.buffer, {
          folder: req.body.folder || 'amazon-clone',
          resource_type: getResourceType(file.mimetype)
        });
        
        cloudinaryResults.push(result);
      }
      
      // Add Cloudinary results to request
      req.cloudinaryResults = cloudinaryResults;
    }
    
    next();
  } catch (error) {
    logger.error(`Error uploading buffer to Cloudinary: ${error.message}`);
    next(error);
  }
};

/**
 * Get Cloudinary resource type based on file mimetype
 * @param {string} mimetype - File mimetype
 * @returns {string} - Cloudinary resource type
 */
const getResourceType = (mimetype) => {
  if (mimetype.startsWith('image/')) {
    return 'image';
  } else if (mimetype.startsWith('video/')) {
    return 'video';
  } else {
    return 'raw';
  }
};

module.exports = {
  upload,
  memoryUpload,
  uploadToCloudinary,
  uploadBufferToCloudinary
};