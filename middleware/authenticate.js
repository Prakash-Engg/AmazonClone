const jwt = require("jsonwebtoken");
const USER = require("../models/userSchema");
// this is a middleware function to authenticate users for each & every API which we pass as a 2nd parameter
const config = process.env;

const authenticate = async (req, res, next) => {
  const token =
    req.body.token ||
    req.query.token ||
    req.params.token ||
    req.headers["x-access-token"];
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

//   try {
//     const token = req.cookies.Amazonweb; // this is cookie stored in token variable
//     const verifyToken = jwt.verify(token, secretKey);
//     console.log("line no 10 uauthenticate.js");
//     console.log(verifyToken);

//     const rootUser = await USER.findOne({
//       _id: verifyToken._id,
//       "tokens.token": token,
//     });
//     console.log(rootUser);

//     if (!rootUser) {
//       throw new Error("user not found");
//     }

//     req.token = token;
//     req.rootUser = rootUser;
//     req.userID = rootUser._id;

//     // why not just sent req.rootUser = rootUser and using
//     // that gets the access to req.rootUser_id or req.rootUser.cart or any other field data

//     next();
//   } catch (error) {
//     res.status(401).send(" Line no. 32 authenticate.js Unauthorised user");
//     console.log(error);
//   }
// };

module.exports = authenticate;
