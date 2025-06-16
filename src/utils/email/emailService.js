const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const logger = require("../logger");

/**
 * Email service for sending emails using nodemailer
 */
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_PORT === "465",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    /**
     * Send an email
     * @param {Object} options - Email options
     * @param {string} options.to - Recipient email
     * @param {string} options.subject - Email subject
     * @param {string} options.template - Template name (without extension)
     * @param {Object} options.data - Data to pass to the template
     * @returns {Promise<Object>} - Nodemailer info object
     */
    async sendEmail(options) {
        try {
            // Render the email template
            const templatePath = path.join(
                __dirname,
                "../../views/emails",
                `${options.template}.ejs`
            );
            const html = await ejs.renderFile(templatePath, options.data);

            // Define email options
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: options.to,
                subject: options.subject,
                html,
            };

            // Send the email
            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent: ${info.messageId}`);
            return info;
        } catch (error) {
            logger.error(`Error sending email: ${error.message}`);
            throw error;
        }
    }

    /**
     * Send a welcome email
     * @param {Object} user - User object
     * @returns {Promise<Object>} - Nodemailer info object
     */
    async sendWelcomeEmail(user) {
        return this.sendEmail({
            to: user.email,
            subject: "Welcome to Amazon Clone!",
            template: "welcome",
            data: {
                name: user.name,
                url: `${process.env.CLIENT_URL}/account`,
            },
        });
    }

    /**
     * Send a password reset email
     * @param {Object} user - User object
     * @param {string} resetToken - Reset token
     * @returns {Promise<Object>} - Nodemailer info object
     */
    async sendPasswordResetEmail(user, resetToken) {
        return this.sendEmail({
            to: user.email,
            subject: "Password Reset Request",
            template: "passwordReset",
            data: {
                name: user.name,
                url: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
                expiresIn: "10 minutes",
            },
        });
    }

    /**
     * Send an order confirmation email
     * @param {Object} user - User object
     * @param {Object} order - Order object
     * @returns {Promise<Object>} - Nodemailer info object
     */
    async sendOrderConfirmationEmail(user, order) {
        return this.sendEmail({
            to: user.email,
            subject: `Order Confirmation #${order.id.substring(0, 8)}`,
            template: "orderConfirmation",
            data: {
                name: user.name,
                orderId: order.id,
                orderDate: new Date(order.createdAt).toLocaleDateString(),
                orderItems: order.items,
                shippingAddress: order.shippingAddress,
                total: order.total,
                url: `${process.env.CLIENT_URL}/account/orders/${order.id}`,
            },
        });
    }

    /**
     * Send a shipping confirmation email
     * @param {Object} user - User object
     * @param {Object} order - Order object
     * @returns {Promise<Object>} - Nodemailer info object
     */
    async sendShippingConfirmationEmail(user, order) {
        return this.sendEmail({
            to: user.email,
            subject: `Your Order #${order.id.substring(0, 8)} Has Shipped`,
            template: "shippingConfirmation",
            data: {
                name: user.name,
                orderId: order.id,
                trackingNumber: order.trackingNumber,
                estimatedDelivery: "3-5 business days",
                url: `${process.env.CLIENT_URL}/account/orders/${order.id}`,
            },
        });
    }

    /**
     * Send an OTP verification email
     * @param {Object} user - User object
     * @param {string} otp - One-time password
     * @returns {Promise<Object>} - Nodemailer info object
     */
    async sendOtpEmail(user, otp) {
        return this.sendEmail({
            to: user.email,
            subject: "Login Verification Code",
            template: "otpVerification",
            data: {
                name: user.name,
                otp,
                expiresIn: "10 minutes",
            },
        });
    }
}

module.exports = new EmailService();
