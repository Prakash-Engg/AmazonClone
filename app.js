require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("./db/conn");
const cookieParser = require("cookie-parser");

const Products = require("./models/productsSchema");
const DefaultData = require("./defaultdata");
const cors = require("cors");
const router = require("./routes/router");
const stripe = require("stripe")(
  "sk_test_51MZsumSA098kyG9410SpHIxmiWujwPqHMWG8DfYTwBw3qpUiXWzVpurbGrdGARltOkBw67qw7oCmVPOlP8Ke4BjL00m9RanAPF"
);
const uuid = require("uuid").v4;

app.use(express.json());
app.use(cookieParser(""));
app.use(
  cors({
    origin: "https://lustrous-licorice-7211fc.netlify.app",
    methods: ["PUT", "GET", "DELETE", "POST"],
    // credentials: true,
  })
);

app.use(function (req, res, next) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://lustrous-licorice-7211fc.netlify.app"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  // res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use(router);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`server is running on port number: ${port}`);
});

DefaultData();
