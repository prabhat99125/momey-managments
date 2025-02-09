const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.port || 4000;
const db = require("./db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const cors = require("cors");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(helmet());
app.use(cookieParser());
app.use(cors({
    origin: "https://money-managments.vercel.app",
    credentials: true
}))

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Allow only 5 attempts per 15 minutes
    message: { message: "Too many attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});

app.get("/", (req, res) => {
    res.send("<h2> server is create </h2>")
})

app.post("/register", authLimiter, async (req, res) => {
    const { userName, email, password, confumPassword } = req.body;
    if (password !== confumPassword) {
        return res.status(209).json({ message: "password not equal" });
    }
    const isEmail = await db.findOne({ email });
    if (isEmail) {
        return res.status(209).json({ message: "email already exists" });
    }
    try {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await db.create({ userName, email, password: hashedPassword });
        const token = jwt.sign({ email }, process.env.tokenKey);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.cookie("authorized", token);
        return res.status(201).json({ message: "register successfully" });
    } catch (error) {
        res.status(500).json({ message: "registration error" })
    }
});
app.post("/login", async (req, res) => {
    try {
        const cookie = req.cookies.authorized;
        // if (cookie) {
        //     try {
        //         const authoraiz = jwt.verify(cookie, process.env.tokenKey);
        //         const authoraizEmail = authoraiz.email;
        //         if (!authoraizEmail) { return res.status(403).json({ error: "Forbidden: Invalid token" }); }
        //         if (authoraizEmail) {
        //             const user = await db.findOne({ email: authoraizEmail });
        //             if (!user) { return res.status(404).json({ error: "User not found" }); }
        //             const { _id, email, userName } = user;
        //             return res.status(200).json({ _id, email, userName });
        //         }
        //     } catch (error) {
        //         res.clearCookie("authorized");
        //         res.status(400).json({ error: "invalid tokan" })
        //     }
        // }
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const user = await db.findOne({ email });
        if (!user) {
            return res.status(403).json({ error: "Invalid email or password" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(403).json({ error: "Invalid email or password" });
        }
        const token = jwt.sign({ email }, process.env.tokenKey);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.cookie("authorized", token);
        return res.status(200).json({ id: user.id, email, userName: user.userName, });
    } catch (e) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/chandla", async (req, res) => {
    try {
        const { sundry } = req.body;
        const cookie = req.cookies.authorized;
        const authoraiz = jwt.verify(cookie, process.env.tokenKey);
        console.log(authoraiz.email);
        if (!authoraiz) {
            return res.status(500).json({ message: "error" });
        }
        if (sundry === "creditors") {
            const user = await db.findOneAndUpdate({ email: authoraiz.email },
                { $push: { creditors: req.body } },
                { new: true }
            );
            console.log(user);
        }
        if (sundry === "debtors") {
            const user = await db.findOneAndUpdate({ email: authoraiz.email },
                { $push: { debtors: req.body } },
                { new: true }
            );
            console.log(user);
        }
        res.status(200).json({ message: "success" })
    } catch (e) {
        res.status(500).json({ message: "error" })
    }

});
app.get("/creditors", async (req, res) => {
    try {
        const cookie = req.cookies.authorized;
        const authoraiz = jwt.verify(cookie, process.env.tokenKey);
        if (!authoraiz) {
            return res.status(500).json({ message: "error" });
        }
        const user = await db.findOne({ email: authoraiz.email });
        res.status(200).json({ user: user.creditors })
    } catch (e) {
        res.status(500).json({ message: "error" })
    }
});
app.get("/debtors", async (req, res) => {
    try {
        const cookie = req.cookies.authorized;
        const authoraiz = jwt.verify(cookie, process.env.tokenKey);
        if (!authoraiz) {
            return res.status(500).json({ message: "error" });
        }
        const user = await db.findOne({ email: authoraiz.email });
        res.status(200).json({ user: user.debtors })
    } catch (e) {
        res.status(500).json({ message: "error" })
    }
})

app.listen(port, console.log(`http://localhost:${port}`))
