require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const routes = require("./routes");

const app = express();

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: true,
  })
);
app.use(cors());

// Connect to MongoDB
mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) throw err;
    console.log("Connected to MongoDB");
  }
);

app.use(routes);

app.use(compression());
// app.use(express.static(path.resolve(__dirname, '../dist')));
// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '../dist/index.html'));
// });

const server = app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}.`);
});
