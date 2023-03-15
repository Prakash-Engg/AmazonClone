const jwt = require("jsonwebtoken");
const USER = require("../models/userSchema");
const secretkey = process.env.KEY;

// this is a middleware function to authenticate users for each & every API which we pass as a 2nd parameter

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.Amazonweb; // this is cookie stored in token variable
    const verifyToken = jwt.verify(token, secretkey);
    console.log(verifyToken);

    const rootUser = await USER.findOne({
      _id: verifyToken._id,
      "tokens.token": token,
    });
    console.log(rootUser);

    if (!rootUser) {
      throw new Error("user not found");
    }

    req.token = token;
    req.rootUser = rootUser;
    req.userID = rootUser._id;

    // why not just sent req.rootUser = rootUser and using
    // that gets the access to req.rootUser_id or req.rootUser.cart or any other field data

    next();
  } catch (error) {
    res.status(401).send("Unauthorised user");
    console.log(error);
  }
};

module.exports = authenticate;
