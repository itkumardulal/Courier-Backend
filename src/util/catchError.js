const catchError = (fn) => {
  return (req, res, next) => {
    try {
      const result = fn(req, res, next);
      if (result && typeof result.catch === 'function') {
        result.catch((err) => {
          return res.status(500).send(err.message);
        });
      }
    } catch (err) {
      return res.status(500).send(err.message);
    }
  };
};

module.exports = catchError;
