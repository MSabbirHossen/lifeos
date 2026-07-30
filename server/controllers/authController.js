const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validateAuthPayload } = require("../utils/validation");

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const authController = {
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const validation = validateAuthPayload({ email, password });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      let user = await User.findOne({ $or: [{ email }, { username }] });
      if (user) {
        return res
          .status(400)
          .json({ success: false, message: "User already exists" });
      }

      user = new User({ username, email, password });
      await user.save();

      const token = createToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: { id: user._id, username: user.username, email: user.email },
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const validation = validateAuthPayload({ email, password });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const token = createToken(user._id);

      res.json({
        success: true,
        token,
        user: { id: user._id, username: user.username, email: user.email },
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.userId).select("-password");
      res.json({ success: true, data: user });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { theme } = req.body;
      const user = await User.findByIdAndUpdate(
        req.userId,
        { theme },
        { new: true },
      ).select("-password");
      res.json({ success: true, data: user });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },
};

module.exports = authController;
