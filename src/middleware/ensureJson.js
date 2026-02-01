const json = (req, res, next) => {
  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', 'application/json');
  }
  
  next();
};

export { json };