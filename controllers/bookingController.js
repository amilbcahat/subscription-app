const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");
const Booking = require("./../models/bookingModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  let user = await User.findByIdAndUpdate(req.user.id, {
    plan: req.params.type,
  });

  user = await User.findById(req.user.id);
  let price = 0;

  if (req.params.type) {
    if (req.params.type == "basic") {
      price = 2000;
    }
    if (req.params.type == "standard") {
      price = 5000;
    }
    if (req.params.type == "premium") {
      price = 7000;
    }
    if (req.params.type == "mobile") {
      price = 1000;
    }
  }

  console.log(`${req.protocol}://${req.get("host")}/`);
  //2) Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    // success_url: `${req.protocol}://${req.get("host")}/my-tours/?tour=${
    //   req.params.tourID
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get("host")}`,
    cancel_url: `${req.protocol}://${req.get("host")}`,
    customer_email: req.user.email,
    client_reference_id: req.user.id,
    line_items: [
      {
        price_data: {
          unit_amount: price * 100,
          currency: "inr",
          product_data: {
            name: `${req.params.type.toUpperCase()} Plan`,
            description: "Payment",
            images: [
              `http://www.snut.fr/wp-content/uploads/2015/08/image-de-paysage.jpg`,
            ],
          },
        },
        quantity: 1,
      },
    ],
  });
  //3) Create Session as response for Frontend
  res.status(200).json({
    status: "success",
    session,
  });
});

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckOut = (req, res, next) => {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed")
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
