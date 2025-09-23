import express from "express";
import cors from "cors";
import { itemRouter } from "./routes/item";
import { stockRouter } from "./routes/stockLog"; // import stockRouter

const app = express();

app.use(
  cors({
    origin: "*", // sementara untuk testing
  })
);

app.use(express.json());

// Routes
app.use("/api/items", itemRouter);
app.use("/api", stockRouter); // sekarang /api/stock-logs & /api/stock bisa diakses

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));

export default app;
