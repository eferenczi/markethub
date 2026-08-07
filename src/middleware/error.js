// Wrap async route handlers so thrown errors reach the error middleware.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// A simple typed error you can throw from anywhere.
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    // eslint-disable-next-line global-require
    require("../observability").captureError(err, `${req.method} ${req.path}`);
  }
  res.status(status).json({
    error: err.message || "Server error",
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { asyncHandler, ApiError, notFound, errorHandler };
