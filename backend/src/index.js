import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("Error: ", error);
      throw error;
    });

    app.listen(port, () => {
      console.log(`⚙️ Server is running at http://localhost:${port}`);
      console.log(
        `Swagger Docs available at http://localhost:${port}/api-docs`
      );
    });
  })
  .catch((err) => {
    console.log("MongooDB connection failed !!! ", err);
  });
