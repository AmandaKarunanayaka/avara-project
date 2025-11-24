const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const RawUser = require("../models/User"); // ✅ fix path
const User = RawUser.default || RawUser;

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set in environment variables");
  const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
  return jwt.sign({ id }, secret, { expiresIn });
};

// ✅ Gmail transporter (use app password in EMAIL_PASS)
// ✅ Gmail transporter (use app password in EMAIL_PASS)
if (!process.env.EMAIL_USER) {
  console.warn("⚠️ EMAIL_USER is not set in environment variables. Email sending may fail.");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter connection
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Transporter connection error:", error);
  } else {
    console.log("✅ Server is ready to take our messages. Sender:", process.env.EMAIL_USER);
  }
});

exports.register = async (req, res) => {
  try {
    let { email, password, name } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    email = String(email).toLowerCase().trim();
    name = typeof name === "string" ? name.trim() : "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: "Invalid email format." });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters long." });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists with this email." });

    // ✅ generate verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // create user
    const user = await User.create({
      email,
      password,
      name,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationTokenExpires,
    });

    // ✅ build verification URL (backend endpoint)
    const baseUrl = process.env.EMAIL_VERIFY_BASE_URL || "http://localhost:3001";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${emailVerificationToken}`;

    // optional header image (from your frontend); override via .env if needed
    const headerImageUrl =
      process.env.EMAIL_HEADER_IMAGE_URL ||
      "http://localhost:3000/src/images/email-header.png";

    // send verification email
    try {
      console.log("📧 Attempting to send email from:", process.env.EMAIL_USER, "to:", user.email);
      await transporter.sendMail({
        from: `"Avara" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Verify your email for Avara",
        html: `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0b0b11; color:#f5f5f5; padding:24px;">
            <div style="max-width:600px;margin:0 auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
              <div style="background:#020617;padding:0;">
                <img src="${headerImageUrl}" alt="Avara" style="width:100%;display:block;max-height:200px;object-fit:cover;" />
              </div>
              <div style="padding:24px 24px 20px 24px;">
                <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:700;color:#f9fafb;">
                  Verify your email
                </h1>
                <p style="margin:0 0 12px 0;font-size:14px;color:#d1d5db;">
                  Hi ${user.name || "there"}, thanks for signing up to <strong>Avara</strong>.
                </p>
                <p style="margin:0 0 18px 0;font-size:14px;color:#9ca3af;">
                  Click the button below to confirm that this email belongs to you and unlock the full Avara experience.
                </p>
                <div style="text-align:center;margin-bottom:24px;">
                  <a href="${verifyUrl}"
                     style="display:inline-block;padding:10px 24px;border-radius:999px;background:#facc15;color:#000000;text-decoration:none;font-weight:600;font-size:14px;">
                    Verify email
                  </a>
                </div>
                <p style="margin:0 0 8px 0;font-size:12px;color:#6b7280;">
                  Or copy and paste this link in your browser:
                </p>
                <p style="margin:0;font-size:12px;color:#9ca3af;word-break:break-all;">
                  ${verifyUrl}
                </p>
              </div>
              <div style="padding:16px 24px;border-top:1px solid #1f2937;font-size:11px;color:#6b7280;text-align:center;">
                © ${new Date().getFullYear()} Avara. Automate. Accelerate. Escape.
              </div>
            </div>
          </div>
        `,
      });
      console.log("✅ Verification email sent to", user.email);
    } catch (emailErr) {
      console.error("Error sending verification email:", emailErr);
      // don't block registration just because email failed
    }

    return res.status(201).json({
      _id: user._id,
      email: user.email,
      name: user.name || "",
      emailVerified: user.emailVerified,
      token: generateToken(user._id),
      message: "Registration successful. Please verify your email.",
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error during registration." });
  }
};

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    email = String(email).toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });

    return res.status(200).json({
      _id: user._id,
      email: user.email,
      name: user.name || "",
      emailVerified: user.emailVerified,
      token: generateToken(user._id),
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error during login." });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Missing token" });

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token." });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    // simple JSON for now; later you can redirect to frontend (/Login?verified=1)
    return res.status(200).json({ message: "Email verified successfully." });
  } catch (err) {
    console.error("Verify email error:", err);
    return res.status(500).json({ message: "Server error during email verification." });
  }
};
