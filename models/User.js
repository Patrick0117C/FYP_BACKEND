const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: String,
    password: String,
    signature: String
});

const User = mongoose.model('FYP User', userSchema);

module.exports = User;
