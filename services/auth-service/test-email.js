require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmail() {
    console.log("📧 Testing email configuration...");
    console.log("User:", process.env.EMAIL_USER);
    // Do not log password

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("❌ Missing EMAIL_USER or EMAIL_PASS in .env");
        return;
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        console.log("Attempting to send test email to:", process.env.EMAIL_USER);
        const info = await transporter.sendMail({
            from: `"Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: "Test Email from Avara Auth Service",
            text: "If you see this, email sending is working!",
        });
        console.log("✅ Email sent successfully!");
        console.log("Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
}

testEmail();
