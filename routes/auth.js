const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = new User({
      username: req.body.username,
      password: hashedPassword,
    });
    await newUser.save();
    res.status(200).json(newUser);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

//  LOGIN
router.post("/login", async (req, res) => {
  const currUsername = req.body.username;
  const currPassword = req.body.password;
  try {
    const user = await User.findOne({ username: currUsername }).populate("documents");;
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const validatePassword = await bcrypt.compare(currPassword, user.password);
    if (validatePassword) {
      res.status(200).json(user);
    } else {
      res.status(400).json({ error: "Wrong credentials" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
