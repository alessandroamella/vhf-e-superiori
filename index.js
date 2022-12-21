import express from "express";
import path from "path";
import "dotenv/config";

const app = express();

app.use(express.static("public"));

app.all("/", (req, res) => {
    res.sendFile(path.join(process.cwd(), "./temppage.html"));
});

const PORT = Number(process.env.PORT) || 3000;
const IP = process.env.IP || "127.0.0.1";
app.listen(PORT, IP, () => {
    console.log(`Server started on ${IP}:${PORT}`);
});
