"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const item_1 = require("./routes/item"); //Import itemRouter
const stockLog_1 = require("./routes/stockLog"); // import stockRouter
const analytics_1 = __importDefault(require("./routes/analytics")); //import analitycRouter
const stock_1 = require("./routes/stock");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use("/api/items", item_1.itemRouter); //api/items
app.use("/api", stockLog_1.stockRouter); // /api/stock-logs & /api/stock
app.use("/api/analytics", analytics_1.default); //api/analitycs
app.use("/api", stock_1.stockOutRouter);
// Start server
exports.default = app;
//# sourceMappingURL=app.js.map