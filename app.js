require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("./db/conn");
const cookieParser = require("cookie-parser");
const axios = require("axios");

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
    origin: "https://exquisite-meringue-3c89fc.netlify.app",
    methods: ["PUT", "GET", "DELETE", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://exquisite-meringue-3c89fc.netlify.app"
  );
  next();
});

axios.defaults.withCredentials = true;

app.use(router);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`server is running on port number: ${port}`);
});

DefaultData();
