const jwt = require("jsonwebtoken");
const USER = require("../models/userSchema");
// this is a middleware function to authenticate users for each & every API which we pass as a 2nd parameter
const config = process.env;

const authenticate = async (req, res, next) => {
  // Modified to check for token in multiple sources
  const token =
    req.body.token ||
    req.query.token ||
    req.params.token ||
    req.headers.authorization ||
    req.headers["x-access-token"];
  // Added check for Authorization header
  if (req.headers.authorization) {
    // Modified to extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
  }
  console.log(`line12 router.js ${token}`);

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    console.log(decoded);
    req.user = decoded;
    console.log("line21 auth");
    req.token = token;
    console.log("line23 auth");
    console.log(decoded.userlogin_id);
    req.rootUser = await USER.findOne({
      _id: decoded.userlogin_id,
    });
    console.log("line 27 auth");
    console.log(req.rootUser);
    if (!req.rootUser) {
      throw new Error();
    }
    req.userID = req.rootUser._id;
  } catch (error) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};

module.exports = authenticate;
