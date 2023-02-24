const User = require("../Model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const signup = async (req, res, next) => {
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    console.log(error);
  }

  if (existingUser)
    res.status(400).json({ message: "User Already Exists! Login Instead" });

  const hashedPassword = await bcrypt.hashSync(password);
  const user = new User({
    name,
    email,
    password: hashedPassword,
  });

  try {
    await user.save();
  } catch (error) {
    res.status(500).json(error);
  }
  res.status(201).json({ message: user });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    return new Error(err);
  }

  if (!existingUser)
    res.status(400).json({ message: "User not found, Signup Please!" });

  const isPasswordCorrect = await bcrypt.compareSync(
    password,
    existingUser?.password
  );

  if (!isPasswordCorrect)
    res.status(401).json({ message: "Invalid Email / Password" });

  const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "30s",
  });
  console.log("Generated Token\n", token);
  if (req.cookies[`${existingUser._id}`]) {
    req.cookies[`${existingUser._id}`] = "";
  }

  res.cookie(String(existingUser.id), token, {
    path: "/",
    expires: new Date(Date.now() + 1000 * 30),
    httpOnly: true,
    sameSite: "lax",
  });

  res.status(200).json({ message: "Successfully LogedIn", token });
};

const verify = async (req, res, next) => {
  const cookies = req.headers?.cookie;

  const token = cookies?.split("=")[1];

  if (!token) res.status(404).json({ message: "No token found" });

  jwt.verify(String(token), process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) res.status(400).json({ message: "Invalid Token" });

    req.id = user.id;
    next();
  });
};

const getUser = async (req, res, next) => {
  const userId = req.id;
  let user;

  try {
    user = await User.findById(userId, "-password");
  } catch (error) {
    return new Error(error);
  }

  if (!user) res.status(404).json({ message: "User Not Found!" });

  res.status(200).json({ user });
};

const refreshToken = async (req, res, next) => {
  const cookies = req.headers?.cookie;

  const prevToken = cookies?.split("=")[1];

  if (!prevToken)
    res.status(400).json({
      message: "We Couldn't find token",
    });

  jwt.verify(String(prevToken), process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      console.log(err);
      res.status(403).json({ message: "Authentication failed" });
    }

    res.clearCookie(`${user.id}`);

    req.cookies[`${user.id}`] = "";

    const newToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "40s",
    });
    console.log("Refreshed Token\n", newToken);

    res.cookie(String(user.id), newToken, {
      path: "/",
      expires: new Date(Date.now() + 1000 * 30),
      httpOnly: true,
      sameSite: "lax",
    });

    req.id = user.id;

    next();
  });
};

const logout = async (req, res, next) => {
  const cookies = req.headers?.cookie;

  const prevToken = cookies?.split("=")[1];

  if (!prevToken)
    res.status(400).json({
      message: "We Couldn't find token",
    });

  jwt.verify(String(prevToken), process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      console.log(err);
      res.status(403).json({ message: "Authentication failed" });
    }

    res.clearCookie(`${user.id}`);

    req.cookies[`${user.id}`] = "";

    res.status(200).json({ message: "Successfully Logged Out!" });
  });
};

module.exports = { signup, login, verify, getUser, refreshToken, logout };
