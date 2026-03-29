import app from "./app.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
console.log("ENV:", process.env.MONGO_URI);
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
})
.catch(err => console.log(err));