const { app, initializeApp } = require("../server/server");

module.exports = async (req, res) => {
  try {
    await initializeApp();
    return app(req, res);
  } catch (error) {
    console.error("Vercel API bootstrap failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server startup failed",
    });
  }
};
