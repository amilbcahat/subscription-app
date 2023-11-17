const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");

exports.getCurrentUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    status: "success",
    data: {
      data: user,
    },
  });
});

exports.joinPlan = catchAsync(async (req, res, next) => {
  var user = await User.findByIdAndUpdate(req.user.id, {
    plan: req.params.type,
  });

  var user = await User.findById(req.user.id);

  res.status(200).json({
    status: "success",
    data: {
      data: user,
    },
  });
});
