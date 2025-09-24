import express from "express";
import cors from "cors";
import { itemRouter } from "./routes/item"; //Import itemRouter
import { stockRouter } from "./routes/stockLog"; // import stockRouter
import analyticsRouter from "./routes/analytics"; //import analitycRouter

const app = express();

app.use(cors());

app.use(express.json());

// Routes
app.use("/api/items", itemRouter); //api/items
app.use("/api", stockRouter); // /api/stock-logs & /api/stock
app.use("/api/analytics", analyticsRouter); //api/analitycs

// Start server

export default app;
