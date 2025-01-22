require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://patrickcheng0117:h6SxcOm2TkAsbsme@fypcluster.skpcx.mongodb.net/FYP?retryWrites=true&w=majority&appName=FYPCluster").then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.log(err);
});
