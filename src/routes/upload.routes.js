const express = require('express');
const { upload, uploadToCloudinary, memoryUpload, uploadBufferToCloudinary } = require('../utils/cloudinary/uploadMiddleware');
const { protect } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route POST /api/upload/single
 * @desc Upload a single file to Cloudinary
 * @access Private
 */
router.post('/single', protect, upload.single('file'), uploadToCloudinary, (req, res) => {
  try {
    if (!req.cloudinaryResult) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        url: req.cloudinaryResult.secure_url,
        publicId: req.cloudinaryResult.public_id,
        format: req.cloudinaryResult.format,
        resourceType: req.cloudinaryResult.resource_type
      }
    });
  } catch (error) {
    logger.error(`Error in upload route: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/upload/multiple
 * @desc Upload multiple files to Cloudinary
 * @access Private
 */
router.post('/multiple', protect, upload.array('files', 5), uploadToCloudinary, (req, res) => {
  try {
    if (!req.cloudinaryResults || req.cloudinaryResults.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const files = req.cloudinaryResults.map(result => ({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type
    }));
    
    res.json({
      message: 'Files uploaded successfully',
      files
    });
  } catch (error) {
    logger.error(`Error in upload route: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/upload/memory
 * @desc Upload a file directly from memory to Cloudinary
 * @access Private
 */
router.post('/memory', protect, memoryUpload.single('file'), uploadBufferToCloudinary, (req, res) => {
  try {
    if (!req.cloudinaryResult) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        url: req.cloudinaryResult.secure_url,
        publicId: req.cloudinaryResult.public_id,
        format: req.cloudinaryResult.format,
        resourceType: req.cloudinaryResult.resource_type
      }
    });
  } catch (error) {
    logger.error(`Error in upload route: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/upload/logo
 * @desc Upload the company logo to Cloudinary
 * @access Private
 */
router.post('/logo', protect, memoryUpload.single('logo'), (req, res, next) => {
  // Set folder to 'amazon-clone/logos'
  req.body.folder = 'amazon-clone/logos';
  next();
}, uploadBufferToCloudinary, (req, res) => {
  try {
    if (!req.cloudinaryResult) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.json({
      message: 'Logo uploaded successfully',
      file: {
        url: req.cloudinaryResult.secure_url,
        publicId: req.cloudinaryResult.public_id,
        format: req.cloudinaryResult.format,
        resourceType: req.cloudinaryResult.resource_type
      }
    });
  } catch (error) {
    logger.error(`Error in upload route: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;