const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../../subscription-app/models/userModel");
const catchAsync = require("../../subscription-app/utils/catchAsync");
const AppError = require("../../subscription-app/utils/appError");
// const Email = require("./../utils/email");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }
  res.cookie("jwt", token, cookieOptions);
  res.header("Authorization", "Bearer " + token);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const url = `${req.protocol}://${req.get("host")}/me`;
  // console.log(url);
  // console.log(newUser);
  // await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(email);
  console.log(password);
  //1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  //2) Check if user exist and password is correct in database
  const user = await User.findOne({ email }).select("+password");
  // console.log(user);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Login Failed ! Retry", 401));
  }
  // console.log(user);

  //3) If everything ok ,send token to client
  createSendToken(user, 200, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check if its there already

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    // return next(new AppError("You are not logged in ", 401));
    res.end(
      "You are not logged in !...Go to http://localhost:8000/login to signin/register first"
    );
    // setTimeout(() => {
    //   location.assign("/login");
    // }, 1500);
  }
  //2) Validate the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //   console.log(decoded);

  //3) Check if user still exists and
  console.log(decoded.id);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to the token no longer exists", 401)
    );
  }
  //4) Check if user changed pass after JWT
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password!please login again", 401)
    );
  }
  //Grant ACCESS to PROTECTED Route
  req.user = currentUser;
  console.log(req.user);
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      token = req.cookies.jwt;

      //  1) verifies token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      //   console.log(decoded);

      //3) Check if user still exists and
      // console.log(decoded.id);
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //4) Check if user changed pass after JWT
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      //THERE IS A LOGGED IN USER
      res.locals.user = currentUser;

      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.redirect("/");
};
