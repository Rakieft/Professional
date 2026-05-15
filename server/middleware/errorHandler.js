function errorHandler(error, _req, res, _next) {
  console.error(error);

  const payload = {
    ok: false,
    message: "Internal server error"
  };

  if (process.env.NODE_ENV !== "production") {
    payload.details = error.message;
  }

  res.status(500).json(payload);
}

module.exports = errorHandler;
