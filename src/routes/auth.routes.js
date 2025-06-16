const express = require("express");
const {
    register,
    login,
    getProfile,
    updateProfile,
    forgotPassword,
    resetPassword,
    uploadProfilePicture,
    verifyOtp,
    logout,
    requestOtp,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const {
    memoryUpload,
    uploadBufferToCloudinary,
} = require("../utils/cloudinary/uploadMiddleware");

const router = express.Router();

/**
 * @route POST /api/register
 * @desc Register a new user
 * @access Public
 */
router.post("/register", register);

/**
 * @route POST /api/login
 * @desc Authenticate user & get token
 * @access Public
 */
router.post("/login", login);

/**
 * @route GET /api/profile
 * @desc Get user profile
 * @access Private
 */
router.get("/profile", protect, getProfile);

/**
 * @route PUT /api/profile
 * @desc Update user profile
 * @access Private
 */
router.put("/profile", protect, updateProfile);

/**
 * @route POST /api/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post("/forgot-password", forgotPassword);

/**
 * @route POST /api/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post("/reset-password", resetPassword);

/**
 * @route POST /api/profile-picture
 * @desc Upload or update user profile picture
 * @access Private
 */
router.post(
    "/profile-picture",
    protect,
    memoryUpload.single("profilePicture"),
    (req, res, next) => {
        // Set folder to 'amazon-clone/profile-pictures'
        req.body.folder = "amazon-clone/profile-pictures";
        next();
    },
    uploadBufferToCloudinary,
    uploadProfilePicture
);

/**
 * @route POST /api/verify-otp
 * @desc Verify OTP sent during login
 * @access Public
 */
router.post("/verify-otp", verifyOtp);

/**
 * @route POST /api/logout
 * @desc Logout user
 * @access Public
 */
router.post("/logout", logout);

router.post("/request-otp", requestOtp);

module.exports = router;
