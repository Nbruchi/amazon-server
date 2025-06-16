const cloudinary = require('cloudinary').v2;
const logger = require('../logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadFile = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || 'amazon',
      resource_type: options.resourceType || 'auto',
      ...options
    });
    
    logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
    return result;
  } catch (error) {
    logger.error(`Error uploading file to Cloudinary: ${error.message}`);
    throw error;
  }
};

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadBuffer = async (buffer, options = {}) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'amazon',
          resource_type: options.resourceType || 'auto',
          ...options
        },
        (error, result) => {
          if (error) {
            logger.error(`Error uploading buffer to Cloudinary: ${error.message}`);
            return reject(error);
          }
          
          logger.info(`Buffer uploaded to Cloudinary: ${result.public_id}`);
          return resolve(result);
        }
      );
      
      uploadStream.end(buffer);
    });
  } catch (error) {
    logger.error(`Error in uploadBuffer: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @returns {Promise<Object>} - Cloudinary deletion result
 */
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`File deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error(`Error deleting file from Cloudinary: ${error.message}`);
    throw error;
  }
};

/**
 * Generate a Cloudinary URL for an asset
 * @param {string} publicId - Public ID of the asset
 * @param {Object} options - Transformation options
 * @returns {string} - Cloudinary URL
 */
const getAssetUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, options);
};

module.exports = {
  cloudinary,
  uploadFile,
  uploadBuffer,
  deleteFile,
  getAssetUrl
};