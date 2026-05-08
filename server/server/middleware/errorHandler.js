function errorHandler(error, _req, res, _next) {
  console.error(error);

  res.status(500).json({
    ok: false,
    message: "Internal server error",
    details: error.message
  });
}

module.exports = errorHandler;
