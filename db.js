require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.db)
    .then(() => {
        console.log("Detabase Connected");
    }).catch((e) => {
        console.log(e)
        console.log("error Detabase Cononection");
    });

const schema = new mongoose.Schema({
    userName: { type: String },
    email: { type: String, },
    password: { type: String },
    debtors: [{
        Payment: String, Name: String, Village: String, date: String, sundry: String
    }],
    creditors: [{
        Payment: String, Name: String, Village: String, date: String, sundry: String
    }]
}, { timestamps: true });

const model = mongoose.model("user", schema);

module.exports = model;