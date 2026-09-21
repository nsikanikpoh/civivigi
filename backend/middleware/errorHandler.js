// Centralized error formatting so controllers can just `throw new Error(...)`
// or reject and let asyncHandler forward it here.
function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Common Mongoose errors get friendlier status codes.
  if (err.name === "ValidationError") statusCode = 400;
  if (err.name === "CastError") statusCode = 400;
  if (err.code === 11000) statusCode = 409;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };
