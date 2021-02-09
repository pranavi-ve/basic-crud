const { secret } = require("../config.js");
const jwt = require('express-jwt');

const authorize = (roles = []) => {
  return [
    jwt({ secret, algorithms: ["HS256"] }),
    (req, res, next) => {
      if (roles && roles.length && !roles.includes(req.user.role)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      next();
    },
  ];
};
module.exports = authorize;
