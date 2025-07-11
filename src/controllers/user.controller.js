import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// Create email transporter function
const createEmailTransporter = async () => {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    // Use Gmail for production
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  } else {
    // Fallback to Ethereal for testing
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Create verification token
  const verificationToken = jwt.sign(
    { email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );

  // Create new user
  const user = await User.create({
    username,
    email,
    password,
    verified: false
  });

  // Remove password from response
  const createdUser = await User.findById(user._id).select("-password");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Create email transporter
  const transporter = await createEmailTransporter();

  // Send verification email
  const verificationLink = `${process.env.BASE_URL}/verify.html?token=${verificationToken}`;
  const mailOptions = {
    from: process.env.GMAIL_USER || '"Test App" <no-reply@test.com>',
    to: email,
    subject: 'Verify Your Email - DataViz',
    html: `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `
  };

  const info = await transporter.sendMail(mailOptions);

  // Log preview link for testing (only for Ethereal)
  if (!process.env.GMAIL_USER) {
    console.log("Preview Email URL:", nodemailer.getTestMessageUrl(info));
  } else {
    console.log("Email sent successfully to:", email);
  }

  return res.status(201).json(
    new ApiResponse(
      200,
      createdUser,
      "User registered successfully. Please check your email (see server logs for preview link)."
    )
  );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.verified) {
      return res.status(200).json(
        new ApiResponse(200, {}, "Email already verified", true)
      );
    }

    user.verified = true;
    await user.save();

    return res.status(200).json(
      new ApiResponse(200, {}, "Email verified successfully", true)
    );
  } catch (error) {
    return res.status(400).json(
      new ApiResponse(400, {}, "Invalid or expired verification token", false)
    );
  }
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { emailOrUsername } = req.body;

    if (!emailOrUsername) {
        throw new ApiError(400, "Email or username is required");
    }

    // Find user by email or username
    const user = await User.findOne({
        $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.verified) {
        throw new ApiError(400, "Email is already verified");
    }

    // Create new verification token
    const verificationToken = jwt.sign(
        { email: user.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    // Create email transporter
    const transporter = await createEmailTransporter();

    // Send verification email
    const verificationLink = `${process.env.BASE_URL}/verify.html?token=${verificationToken}`;
    const mailOptions = {
        from: process.env.GMAIL_USER || '"Test App" <no-reply@test.com>',
        to: user.email,
        subject: 'Verify Your Email - DataViz',
        html: `
            <h1>Email Verification</h1>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
        `
    };

    const info = await transporter.sendMail(mailOptions);

    // Log preview link for testing (only for Ethereal)
    if (!process.env.GMAIL_USER) {
        console.log("Preview Email URL:", nodemailer.getTestMessageUrl(info));
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Verification email sent successfully. Please check your email (see server logs for preview link)."
        )
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
        throw new ApiError(400, "Email/Username and password are required");
    }

    // Find user by email or username
    const user = await User.findOne({
        $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Only allow login if user.status is true
    if (user.status !== true) {
        throw new ApiError(403, "Your account is currently inactive.");
    }

    // Check if password is correct
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Check if user is verified
    if (!user.verified) {
        // Create new verification token
        const verificationToken = jwt.sign(
            { email: user.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        );

        // Create email transporter
        const transporter = await createEmailTransporter();

        // Send verification email
        const verificationLink = `${process.env.BASE_URL}/verify.html?token=${verificationToken}`;
        const mailOptions = {
            from: process.env.GMAIL_USER || '"Test App" <no-reply@test.com>',
            to: user.email,
            subject: 'Verify Your Email - DataViz',
            html: `
                <h1>Email Verification</h1>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
                <p>This link will expire in 24 hours.</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        // Log preview link for testing (only for Ethereal)
        if (!process.env.GMAIL_USER) {
            console.log("Preview Email URL:", nodemailer.getTestMessageUrl(info));
        }

        throw new ApiError(
            403,
            "Email not verified. A new verification email has been sent to your email address."
        );
    }

    // Generate access token
    const accessToken = user.generateAccessToken();

    // Get user data without password
    const loggedInUser = await User.findById(user._id).select("-password");

    // Set cookie options
    const options = {
        httpOnly: true, // Makes the cookie inaccessible to JavaScript
        secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS in production
        sameSite: 'strict', // Protect against CSRF
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    };

    // Set the access token in an HTTP-only cookie
    res.cookie('accessToken', accessToken, options);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken // Still sending in response for localStorage
            },
            "Login successful"
        ) 
    );
});

const sendResetPasswordLink = asyncHandler(async (req, res) => {
    const { emailOrUsername } = req.body;

    if (!emailOrUsername) {
        throw new ApiError(400, "Email or username is required");
    }

    // Find user by email or username
    const user = await User.findOne({
        $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Create reset password token
    const resetToken = jwt.sign(
        { 
            email: user.email,
            id: user._id 
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' } // Reset links typically expire sooner than regular tokens
    );

    // Create email transporter
    const transporter = await createEmailTransporter();

    // Send reset password email
    const resetLink = `${process.env.BASE_URL}/reset-password.html?token=${resetToken}`;
    const mailOptions = {
        from: process.env.GMAIL_USER || '"Test App" <no-reply@test.com>',
        to: user.email,
        subject: 'Reset Your Password - DataViz',
        html: `
            <h1>Password Reset Request</h1>
            <p>You requested to reset your password. Click the link below to reset it:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
        `
    };

    const info = await transporter.sendMail(mailOptions);

    // Log preview link for testing (only for Ethereal)
    if (!process.env.GMAIL_USER) {
        console.log("Preview Email URL:", nodemailer.getTestMessageUrl(info));
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password reset link has been sent to your email (see server logs for preview link)."
        )
    );
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        throw new ApiError(400, "Token and new password are required");
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Find user
        const user = await User.findOne({ 
            _id: decoded.id,
            email: decoded.email 
        });

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Update password
        user.password = newPassword; // Password will be hashed by the pre-save middleware
        await user.save();

        return res.status(200).json(
            new ApiResponse(200, {}, "Password reset successful")
        );

    } catch (error) {
        throw new ApiError(400, "Invalid or expired reset token");
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    // req.user is available because of verifyJWT middleware

    // Clear the access token cookie
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    });

    return res.status(200)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Get current user information
const getCurrentUser = asyncHandler(async (req, res) => {
    // req.user is set by the auth middleware
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Get user info excluding password
    const user = await User.findById(userId).select("-password");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200)
        .json(new ApiResponse(
            200,
            user,
            "User details fetched successfully"
        ));
});

// Function to check and update expired premium users
const checkAndUpdateExpiredPremium = asyncHandler(async () => {
    try {
        // Find all premium users whose premium has expired
        const expiredUsers = await User.updateMany(
            {
                type: "premium",
                premiumExpiresAt: { $lt: new Date() }
            },
            {
                $set: { type: "free" }
            }
        );

        console.log(`Updated ${expiredUsers.modifiedCount} expired premium users to free tier`);
    } catch (error) {
        console.error("Error updating expired premium users:", error);
    }
});

// Set up periodic check (run every 24 hours)
setInterval(checkAndUpdateExpiredPremium, 24 * 60 * 60 * 1000);

// Run initial check when server starts
checkAndUpdateExpiredPremium();

export {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  sendResetPasswordLink,
  resetPassword,
  logoutUser,
  getCurrentUser,
  checkAndUpdateExpiredPremium // Export the function in case we need it elsewhere
};
