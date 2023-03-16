const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRET_KEY;

const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Not a valid Email");
      }
    },
  },
  password: {
    type: String,
    required: true,
    unique: true,
    minlength: 6,
  },
  cpassword: {
    type: String,
    required: true,
    unique: true,
    minlength: 6,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  carts: Array,
  orders: Array,
});

//why not we are hashing the password in the routerjs file

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
    this.cpassword = await bcrypt.hash(this.cpassword, 12);
  }

  next();
});

// token geneartaion process

//   mongoose instance method for adding token
//     to the user details because it is to update/add
//     data after a document is added to the collection

userSchema.methods.generateAuthtoken = async function () {
  try {
    let token = jwt.sign({ _id: this._id }, secretKey); // can we use any other details as payload instead of _id
    this.tokens = this.tokens.concat({ token: token });
    await this.save();
    return token;
  } catch (error) {
    console.log("Error in userscheema line 76");
  }
};

//add to cart data

userSchema.methods.addcartdata = async function (cart) {
  try {
    this.carts = this.carts.concat({ cart });
    await this.save();
    return this.carts;
  } catch (error) {
    console.log(error);
  }
};

//add YOUR orders

userSchema.methods.addorderdata = async function (order) {
  try {
    this.orders = this.orders.concat({ order });
    await this.save();
    return this.orders;
  } catch (error) {
    console.log(error);
  }
};

userSchema.methods.updateUser = async function (
  name,
  email,
  password,
  cpassword
) {
  try {
    this.fname = name;
    this.email = email;
    this.password = await bcrypt.hash(password, 12);
    this.cpassword = await bcrypt.hash(cpassword, 12);

    await this.save();
    return;
  } catch (error) {
    console.log(error);
  }
};

const USER = new mongoose.model("USER", userSchema);

module.exports = USER;
