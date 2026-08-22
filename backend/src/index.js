import "dotenv/config";
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Dayflow API is running!"
    })
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Dayflow API running on http://localhost:${PORT}`);
});