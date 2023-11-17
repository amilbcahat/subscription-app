const mongoose = require("mongoose");
const dotenv = require("dotenv");
//Catching Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception ! Shutting down");
  console.log(err.name, err.message, err.stack);

  process.exit(1);
});

dotenv.config({ path: "./config.env" });
// const DB =
//   "mongodb+srv://Acadhut:<PASSWORD>@cluster0.tnsg0hd.mongodb.net/Acadhut?retryWrites=true&w=majority".replace(
//     "<PASSWORD>",
//     process.env.DATABASE_PASSWORD
//   );

const DB = process.env.DATABASE_LOCAL;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    // console.log(con.connections);
    console.log("Database connected");
  });

const app = require("./app");

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...`);
});
//Unhandled Rejection
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled rejection! Shutting down");
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM recieved .Shutting down gracefully");
  server.close(() => {
    console.log("Process terminated !");
  });
});
