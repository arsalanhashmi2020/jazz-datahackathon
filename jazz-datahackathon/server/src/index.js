import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Router } from "./routes/uploadRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());

const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI || "mongodb+srv://arsalanhashmi2018:zV7D1HbxsJSrbaBi@vector.ydhqka2.mongodb.net/?retryWrites=true&w=majority&appName=Vector";

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true
})
.then(() => console.log('MongoDB connection successful'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/', Router);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
