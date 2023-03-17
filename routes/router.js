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
  // console.log(req.body);
  const { fname, email, mobile, password, cpassword } = req.body;

  if (!fname || !email || !mobile || !password || !cpassword) {
    res.status(422).json({ error: "filll the all details" });
    console.log("bhai nathi present badhi details");
  }

  try {
    const preuser = await USER.findOne({ email: email });

    if (preuser) {
      res.status(422).json({ error: "This email is already exist" });
    } else if (password !== cpassword) {
      res.status(422).json({ error: "password are not matching" });
    } else {
      const finaluser = new User({
        fname,
        email,
        mobile,
        password,
        cpassword,
      });

      // yaha pe hasing krenge

      const storedata = await finaluser.save();
      // console.log(storedata + "user successfully added");
      res.status(201).json(storedata);
    }
  } catch (error) {
    console.log(
      "error the bhai catch ma for registratoin time" + error.message
    );
    res.status(422).send(error);
  }
});

//login user API

router.post("/login", async (req, res) => {
  // console.log(req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "fill the details" });
  }

  try {
    const userlogin = await USER.findOne({ email: email });
    console.log(userlogin);
    if (userlogin) {
      const isMatch = await bcrypt.compare(password, userlogin.password);
      console.log(isMatch);

      if (!isMatch) {
        res.status(400).json({ error: "invalid crediential pass" });
      } else {
        const token = await userlogin.generatAuthtoken();
        console.log(token);

        res.cookie("Amazonweb", token, {
          expires: new Date(Date.now() + 2589000),
          httpOnly: false, // cookie is accessible via client-side JavaScript // cookie will only be sent over HTTPS
          // cookie will only be sent for same-site requests
        });
        res.status(201).json(userlogin);
      }
    } else {
      res.status(400).json({ error: "user not exist" });
    }
  } catch (error) {
    res.status(400).json({ error: "invalid crediential pass" });
    console.log("error the bhai catch ma for login time" + error.message);
  }
});

//adding data inTo cart API

router.post("/addcart/:id", authenticate, async (req, res) => {
  try {
    console.log("perfect 6");
    const { id } = req.params;
    const cart = await Products.findOne({ id: id });
    console.log(cart + "cart milta hain");

    const Usercontact = await User.findOne({ _id: req.userID });
    console.log(Usercontact + "user milta hain");

    if (Usercontact) {
      const cartData = await Usercontact.addcartdata(cart);

      await Usercontact.save();
      console.log(cartData + " thse save wait kr");
      console.log(Usercontact + "userjode save");
      res.status(201).json(Usercontact);
    }
  } catch (error) {
    console.log(error);
  }
});

//get cart details API

router.get("/cartdetails", authenticate, async (req, res) => {
  try {
    const buyuser = await USER.findOne({ _id: req.userID });
    console.log(buyuser + "user hain buy pr");
    res.status(201).json(buyuser);
  } catch (error) {
    console.log(error + "error for buy now");
  }
});

//get valid user

router.get("/validuser", authenticate, async (req, res) => {
  try {
    const validuserone = await USER.findOne({ _id: req.userID });
    console.log(validuserone + "user hain home k header main pr");
    res.status(201).json(validuserone);
  } catch (error) {
    console.log(error + "error for valid user");
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
    req.rootUser.tokens = req.rootUser.tokens.filter((curelem) => {
      return curelem.token !== req.token;
    });

    res.clearCookie("Amazonweb", { path: "/" });
    req.rootUser.save();
    res.status(201).json(req.rootUser.tokens);
    console.log("user logout");
  } catch (error) {
    console.log(error + "jwt provide then logout");
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
