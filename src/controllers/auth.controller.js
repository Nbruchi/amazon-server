const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");
const emailService = require("../utils/email/emailService");

const prisma = new PrismaClient();

/**
 * Register a new user
 * @route POST /api/register
 * @access Public
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const userExists = await prisma.user.findUnique({
            where: { email },
        });

        if (userExists) {
            res.status(400);
            throw new Error("User already exists");
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                cart: {
                    create: {}, // Create an empty cart for the user
                },
                wishlist: {
                    create: {}, // Create an empty wishlist for the user
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        // Generate JWT token
        const token = generateToken(user.id);

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail(user);
            logger.info(`Welcome email sent to ${user.email}`);
        } catch (emailError) {
            logger.error(`Error sending welcome email: ${emailError.message}`);
            // Don't throw error, continue with registration
        }

        res.status(201).json({
            ...user,
            token,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Authenticate user & send OTP
 * @route POST /api/login
 * @access Public
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401);
            throw new Error("Invalid email or password");
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401);
            throw new Error("Invalid email or password");
        }

        // Generate OTP and expiry
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: { otp, otpExpiry },
        });

        await emailService.sendOtpEmail(user, otp);

        res.json({
            otpSent: true,
            userId: user.id,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user profile
 * @route GET /api/profile
 * @access Private
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
                role: true,
                createdAt: true,
                addresses: {
                    where: { isDefault: true },
                    take: 1,
                },
                paymentMethods: {
                    where: { isDefault: true },
                    take: 1,
                },
            },
        });

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile
 * @route PUT /api/profile
 * @access Private
 */
const updateProfile = async (req, res, next) => {
    try {
        const { name, email, password, profilePicture } = req.body;

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        // Update user data
        const updateData = {
            name: name || user.name,
            email: email || user.email,
            profilePicture: profilePicture || user.profilePicture,
        };

        // If password is provided, hash it
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
                role: true,
                createdAt: true,
            },
        });

        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

/**
 * Generate JWT token
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Forgot password - send password reset email
 * @route POST /api/forgot-password
 * @access Public
 */
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save reset token to user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // Send password reset email
        try {
            await emailService.sendPasswordResetEmail(user, resetToken);
            logger.info(`Password reset email sent to ${user.email}`);
        } catch (emailError) {
            logger.error(
                `Error sending password reset email: ${emailError.message}`
            );
            res.status(500);
            throw new Error("Error sending password reset email");
        }

        res.json({ message: "Password reset email sent" });
    } catch (error) {
        next(error);
    }
};

/**
 * Reset password
 * @route POST /api/reset-password
 * @access Public
 */
const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;

        // Find user with valid reset token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            res.status(400);
            throw new Error("Invalid or expired reset token");
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        res.json({ message: "Password reset successful" });
    } catch (error) {
        next(error);
    }
};

/**
 * @route POST /api/auth/verify-otp
 * @desc Verify OTP and password for login
 * @access Public
 */
const verifyOtp = async (req, res, next) => {
    try {
        const { userId, otp, password } = req.body;
        if (!userId || !otp || !password) {
            res.status(400);
            throw new Error("User ID, OTP, and password are required");
        }

        // Find user with valid OTP
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                otp,
                otpExpiry: {
                    gte: new Date(),
                },
            },
        });

        if (!user) {
            res.status(400);
            throw new Error("Invalid or expired OTP");
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401);
            throw new Error("Invalid password");
        }

        // Clear OTP after successful verification
        await prisma.user.update({
            where: { id: user.id },
            data: { otp: null, otpExpiry: null },
        });

        // Generate token (implement your own token logic)
        const token = generateToken(user.id);

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            token,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload or update user profile picture
 * @route POST /api/profile-picture
 * @access Private
 */
const uploadProfilePicture = async (req, res, next) => {
    try {
        if (!req.cloudinaryResult) {
            res.status(400);
            throw new Error("No file uploaded");
        }

        // Update user profile picture
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                profilePicture: req.cloudinaryResult.secure_url,
            },
            select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
                role: true,
            },
        });

        res.json({
            message: "Profile picture updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout user (invalidate OTP and reset tokens)
 * @route POST /api/logout
 * @access Private
 */
const logout = async (req, res, next) => {
    try {
        // Invalidate OTP and reset tokens for the user
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                otp: null,
                otpExpiry: null,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        res.json({ message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
};

/**
 * @route POST /api/auth/request-otp
 * @desc Request OTP for login
 * @access Public
 */
const requestOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400);
            throw new Error("Email is required");
        }

        // Find user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        // Generate OTP and expiry
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP and expiry to user
        await prisma.user.update({
            where: { id: user.id },
            data: { otp, otpExpiry },
        });

        // Send OTP email
        await emailService.sendOtpEmail(user, otp);

        res.json({ otpSent: true, userId: user.id });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    forgotPassword,
    resetPassword,
    verifyOtp,
    uploadProfilePicture,
    logout,
    requestOtp,
};
