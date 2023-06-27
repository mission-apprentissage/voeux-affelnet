module.exports = () => {
  // eslint-disable-next-line no-unused-vars
  return (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, API-Key, Authorization"
    );
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH");
    res.header("Access-Control-Expose-Headers", "Set-Cookie");
    next();
  };
};
