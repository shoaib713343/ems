import express from "express";
import "dotenv/config";
import { errorHandler } from "./middlewares/errorHandler";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/user/user.routes"
import cors from "cors";



const app = express();
app.use(cookieParser());

app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
    res.status(200).json({
        message: "server is up and running"
    })
})

app.use("/api/v1/auth", authRoutes )

app.use(errorHandler);

export default app;