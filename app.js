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
    origin: "https://idyllic-strudel-90a591.netlify.app",
    methods: [PUT, GET, DELETE, POST],
  })
);
app.use(router);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`server is running on port number: ${port}`);
});

DefaultData();
