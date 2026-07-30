const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = status === 500 && process.env.NODE_ENV === "production"
    ? "Internal server error"
    : err.message || "Server error";

  if (process.env.NODE_ENV !== "production") {
    console.error(`[${req.method}] ${req.originalUrl}`, err.stack || err.message);
  }

  res.status(status).json({
    success: false,
    message,
    errors: err.errors || [],
  });
};

module.exports = errorHandler;
