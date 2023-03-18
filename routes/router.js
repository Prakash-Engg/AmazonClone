const express = require("express");
const router = new express.Router();
const Products = require("../models/productsSchema");
const USER = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const authenticate = require("../middleware/authenticate");
const jwt = require("jsonwebtoken");

const stripe = require("stripe")(
  "sk_test_51MZsumSA098kyG9410SpHIxmiWujwPqHMWG8DfYTwBw3qpUiXWzVpurbGrdGARltOkBw67qw7oCmVPOlP8Ke4BjL00m9RanAPF"
);
const uuid = require("uuid").v4;

const weekday = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const year = 1000 * 60 * 60 * 24 * 365;

// get productsdata API
router.get("/getproducts", async (req, res) => {
  try {
    const productsdata = await Products.find();
    // console.log("API wala data hai: " + productsdata);
    res.status(201).json(productsdata);
  } catch (error) {
    console.log("error" + error.message);
  }
});

//get individual data here  we are creating api for individual data

router.get("/getproductsone/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // const id = req.params.id;
    // console.log(id);

    const individualdata = await Products.findOne({ id: id });

    // console.log(individualdata + "Ho gaya");

    res.status(201).json(individualdata);
  } catch (error) {
    res.status(400).json(individualdata);
    console.log("error" + error.message);
  }
});

// register user

router.post("/register", async (req, res) => {
  const { fname, mobile, email, password, cpassword } = req.body;

  if (!fname || !mobile || !email || !password || !cpassword) {
    res.status(422).json({ error: "All fields have to be filled" });
    console.log("no data available");
  }

  try {
    const preuser = await USER.findOne({ email: email });

    if (preuser) {
      res.status(422).json({ error: "This email is already registered" });
    } else if (password !== cpassword) {
      res
        .status(422)
        .json({ error: "Password and confirm password do not match" });
    } else {
      const finalUser = new USER({ fname, mobile, email, password, cpassword });

      const token = jwt.sign(
        { finalUser_id: finalUser._id, email },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      finalUser.token = token;

      const storedata = await finalUser.save();
      console.log(`Line104 router.js ${storedata}`);

      res.status(201).json({ storedata, token }); // send storedata object and token together
    }
  } catch (error) {
    console.log(`Line109 router.js ${error}`);
  }
});

//login user API

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "All fields are mandatory" });
    return;
  }

  try {
    const userlogin = await USER.findOne({ email: email });

    if (userlogin && (await bcrypt.compare(password, userlogin.password))) {
      const token = jwt.sign(
        { userlogin_id: userlogin._id, email },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      userlogin.token = token;
      res.status(201).json(userlogin);
      console.log("line136 router.js All good");
      return;
    }

    res.status(400).json({ error: "Invalid Credentials" });
  } catch (err) {
    console.log(`line139 router.js ${err}`);
  }
});

module.exports = router;

//adding data inTo cart API

router.post("/addcart/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const cart = await Products.findOne({ id: id });
    console.log(cart + "cart value");

    const UserContact = await USER.findOne({ _id: req.userID });
    console.log(UserContact);

    if (UserContact) {
      const cartdata = await UserContact.addcartdata(cart);
      await UserContact.save(); // why we are saving 2 times here UserContact.save() and in UserSchems.js this.save()
      console.log(cartdata);
      res.status(201).json(UserContact); // why not just sent cartdata as a response instead of UserContact that also works maybe
    } else {
      res.status(401).json({ error: "Invalid user" });
    }
  } catch (error) {
    res.status(401).json({ error: "Invalid user" });
  }
});

//test api for authentication middleware

router.get("/welcome", authenticate, (req, res) => {
  res.send("Welcome");
});

//get cart details API

router.get("/cartdetails", authenticate, async (req, res) => {
  try {
    const buyUser = await USER.findOne({ _id: req.userID });
    res.status(201).json(buyUser);
  } catch (error) {
    console.log("line183 router.js" + error);
  }
});

//get valid user

router.get("/validuser", authenticate, async (req, res) => {
  try {
    const validuser = await USER.findOne({ _id: req.userID });
    res.status(201).json(validuser);
  } catch (error) {
    console.log("error" + error);
  }
});

// remove item from cart

router.delete("/removeItem/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    req.rootUser.carts = req.rootUser.carts.filter((currentValue) => {
      return currentValue.cart.id !== id;
    });

    req.rootUser.save();
    res.status(201).json(req.rootUser);
    console.log("item removed");
  } catch (error) {
    console.log("Error" + error);
    res.status(400).json(req.rootUser);
  }
});

//Log out API

router.get("/logout", authenticate, async (req, res) => {
  try {
    const updatedUser = await USER.findOneAndUpdate(
      { _id: req.userID },
      { $set: { token: null } },
      { new: true }
    );
    if (updatedUser) {
      res.cookie("AmazonClonecookie", "", {
        expires: new Date(0),
        path: "/",
        secure: true,
      });
      res.status(201).json({ message: "Logout successful" });
    } else {
      res.status(500).send({ message: "Failed to update user with new token" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// Payment API

router.post("/checkout", authenticate, async (req, res) => {
  // console.log(req.body);
  const { product, token } = req.body;

  try {
    const UserContact = await USER.findOne({ _id: req.userID });
    // console.log(`${UserContact} This is awesome`);

    console.log(new Date().getDate());
    console.log(1970 + Math.round(Date.now() / year));
    console.log(weekday[new Date().getDay()]);
    console.log(months[new Date().getMonth()]);

    const key = uuid();
    console.log(key);

    const order = {
      date: new Date().getDate(),
      year: 1970 + Math.round(Date.now() / year),
      day: weekday[new Date().getDay()],
      month: months[new Date().getMonth()],
      description: product.description,
      discount: product.discount,
      id: product.id,
      price: product.price,
      tagline: product.tagline,
      title: product.title,
      url: product.url,
      _id: product._id,
      __v: product.__v,
      amount: product.price.cost,
      shipping: {
        name: token.card.name,
        address: {
          line1: token.card.address_line1,
          line2: token.card.address_line2,
          city: token.card.address_city,
          country: token.card.address_country,
          postal_code: token.card.address_zip,
        },
      },
      key: key,
      stripeToken_id: token.id,
      email: token.email,
      last4: token.card.last4,
    };

    if (UserContact) {
      const orderdata = await UserContact.addorderdata(order);
      await UserContact.save(); // why we are saving 2 times here UserContact.save() and in UserSchems.js this.save()
      // console.log(orderdata);
      // res.status(201).json(UserContact); // why not just sent cartdata as a response instead of UserContact that also works maybe

      UserContact.carts = UserContact.carts.filter((currentValue) => {
        return currentValue.cart.id !== product.id;
      });

      await UserContact.save();
      res.status(201).json(UserContact);
      console.log("item removed");
    } else {
      res.status(401).json({ error: "Invalid user" });
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(400).json(UserContact);
  }
});

//My profile API

router.post("/profile", authenticate, async (req, res) => {
  // Break

  const { name, email, password, cpassword } = req.body;

  try {
    const UserContact = await USER.findOne({ _id: req.userID });
    if (UserContact) {
      const updateuser = await UserContact.updateUser(
        name,
        email,
        password,
        cpassword
      );
      await UserContact.save();

      res.status(201).json(UserContact);
      console.log("User updated");
    }
    // else {
    //   res.status(401).json({ error: "Invalid user" });
    // }
  } catch (error) {
    console.log("Error:", error);
    res.status(400).json(UserContact);
  }
});

module.exports = router;

//bcryptjs algorith for hashing

//password hashing process
