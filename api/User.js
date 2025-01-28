const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

const fs = require('fs');
const path = require('path');

const User = require('../models/User');

const bcrypt = require('bcrypt');

// Function to compare signatures using Python
const compareSignatures = (signature1, signature2) => {
    return new Promise((resolve, reject) => {
        // Create temporary file paths
        const signature1Path = path.join(__dirname, 'temp_signature1.png');
        const signature2Path = path.join(__dirname, 'temp_signature2.png');
        const pythonScriptPath = path.join(__dirname, 'compare.py'); // Path to the Python script


        // Function to save base64 to file
        const saveBase64ToFile = (base64String, filePath) => {
            return new Promise((resolve, reject) => {
                // Remove the header if present
                if (base64String.startsWith('data:image/png;base64,')) {
                    base64String = base64String.replace('data:image/png;base64,', '');
                }
                // Decode base64 and write to file
                fs.writeFile(filePath, base64String, { encoding: 'base64' }, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        };

        // Save the signatures to temporary files
        Promise.all([
            saveBase64ToFile(signature1, signature1Path),
            saveBase64ToFile(signature2, signature2Path)
        ])
        .then(() => {
            // Execute the Python script
            exec(`python3 "${pythonScriptPath}" "${signature1Path}" "${signature2Path}"`, (error, stdout, stderr) => {
                // Cleanup temporary files after execution
                fs.unlink(signature1Path, (err) => { if (err) console.error(`Error deleting ${signature1Path}:`, err); });
                fs.unlink(signature2Path, (err) => { if (err) console.error(`Error deleting ${signature2Path}:`, err); });
                
                if (error) {
                    reject(stderr);
                } else {
                    resolve(stdout);
                }
            });
        })
        .catch(err => reject(err));
    });
};

router.post('/signup', (req, res) => {
    let { name, email, password, signature } = req.body;
    name = name.trim();
    email = email.trim();
    password = password.trim();
    signature = signature.trim();

    if (!name || !email || !password || !signature) {
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
                    const user = new User({ name, email, password: hashPassword, signature });
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
    let { email, password, signature } = req.body;
    email = email.trim();
    password = password.trim();
    signature = signature.trim();

    if (!email || !password || !signature) {
        res.json({
            status: 'error',
            message: 'Empty credentials provided'
        })
    }
    else {
        User.find({ email }).then(data => {
            console.log(data);
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

router.post('/compare-signatures', async (req, res) => {
    const { signature1, signature2 } = req.body;

    if (!signature1 || !signature2) {
        return res.json({ status: 'error', message: 'Signatures are required' });
    }

    try {
        const similarityScore = await compareSignatures(signature1, signature2);
        res.json({ status: 'success', similarityScore });
    } catch (err) {
        console.log(err);
        res.json({ status: 'error', message: 'Error comparing signatures' });
    }
});


module.exports = router;
