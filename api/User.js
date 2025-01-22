const express = require('express');
const router = express.Router();

const User = require('../models/User');

const bcrypt = require('bcrypt');

router.post('/signup', (req, res) => {
    let { name, email, password } = req.body;
    name = name.trim();
    email = email.trim();
    password = password.trim();

    if (!name || !email || !password) {
        res.json({
            status: 'error',
            message: 'Invalid form submission'
        })
    }
    else if (!/^[a-zA-Z ]+$/.test(name)) {
        res.json({
            status: 'error',
            message: 'Invalid name'
        })
    }
    else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        res.json({
            status: 'error',
            message: 'Invalid email'
        })
    }
    else if (password.length < 8) {
        res.json({
            status: 'error',
            message: 'Password too short'
        })
    }
    else {
        User.find({ email }).then(result => {
            if (result.length) {
                res.json({
                    status: 'error',
                    message: 'Email already in use'
                })
            }
            else {
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds).then(hashPassword => {
                    const user = new User({ name, email, password: hashPassword });
                    user.save().then(() => {
                        res.json({
                            status: 'success',
                            message: 'User created'
                        })
                    }).catch(err => {
                        console.log(err);
                        res.json({
                            status: 'error',
                            message: 'Something went wrong'
                        })
                    })
                }).catch(err => {
                    console.log(err);
                    res.json({
                        status: 'error',
                        message: 'An error occurred while hashing the password'
                    })
                })

            }

        }).catch(err => {
            console.log(err);
            res.json({
                status: 'error',
                message: 'Something went wrong'
            })
        })

    }
})

router.post('/signin', (req, res) => {
    let { email, password } = req.body;
    email = email.trim();
    password = password.trim();

    if (!email || !password) {
        res.json({
            status: 'error',
            message: 'Empty credentials provided'
        })
    }
    else {
        User.find({ email }).then(data => {
            if (data.length) {
                const hashPassword = data[0].password;
                bcrypt.compare(password, hashPassword).then(result => {
                    if (result) {
                        res.json({
                            status: 'success',
                            message: 'User authenticated',
                            data: data
                        })
                    }
                    else {
                        res.json({
                            status: 'error',
                            message: 'Invalid password'
                        })
                    }
                }).catch(err => {
                    console.log(err);
                    res.json({
                        status: 'error',
                        message: 'An error occurred while comparing passwords'
                    })
                })
            }
            else {
                res.json({
                    status: 'error',
                    message: 'Invalid credentials entered'
                })
            }
        }).catch(err => {
            console.log(err);
            res.json({
                status: 'error',
                message: 'An error occurred while finding the user'
            })
        })
    }
})


module.exports = router;