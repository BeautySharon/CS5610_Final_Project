import express from "express";
import cors from "cors";
import pawtrust from "./api/pawtrust.route.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/pawtrust", pawtrust);
app.use("*", (req, res) => res.status(404).json({ error: "not found" }));

export default app;
