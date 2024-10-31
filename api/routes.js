const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer');

require('dotenv').config();

const app = express();
const PORT = 3500;

// File paths for visit count and IP logs
const counterFile = path.join(__dirname, 'counter.txt');
const ipLogFile = path.join(__dirname, 'ip_log.json');

// Initialize visit count
let visitCount = 0;
if (fs.existsSync(counterFile)) {
    const fileData = fs.readFileSync(counterFile, 'utf-8');
    visitCount = parseInt(fileData, 10) || 0;
}

// Initialize IP logs
let ipLogs = {};
if (fs.existsSync(ipLogFile)) {
    ipLogs = JSON.parse(fs.readFileSync(ipLogFile, 'utf-8'));
}

// Check if an IP should be counted
const shouldCountVisit = (ip) => {
    const currentTime = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (!ipLogs[ip]) return true; // Count if IP not logged
    return currentTime - ipLogs[ip] >= oneDay; // Count if last visit > 24 hours
};

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'COSCI',
    cookie: { maxAge: 60000000 },
    resave: true,
    saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  
        pass: process.env.EMAIL_PASS    
    }
});

// API endpoint to submit a report
app.post('/report', (req, res) => {
    const { fullName, email, phoneNumber, reportType, description } = req.body;

    // Setup email data
    const mailOptions = {
        from: 'aimmy007@gmail.com',
        to: email,
        subject: 'Cyber Crime Report Submission',
        html: `
        <html>
            <body>
                <h2 style="color: #2c3e50;">Cyber Crime Report Submission</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <th style="text-align: left; padding: 8px; background-color: #3498db; color: white;">Field</th>
                        <th style="text-align: left; padding: 8px; background-color: #3498db; color: white;">Details</th>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 8px;">Full Name</td>
                        <td style="border: 1px solid #ccc; padding: 8px;">${fullName}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 8px;">Email</td>
                        <td style="border: 1px solid #ccc; padding: 8px;">${email}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 8px;">Phone Number</td>
                        <td style="border: 1px solid #ccc; padding: 8px;">${phoneNumber}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 8px;">Report Type</td>
                        <td style="border: 1px solid #ccc; padding: 8px;">${reportType}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 8px;">Description</td>
                        <td style="border: 1px solid #ccc; padding: 8px; background-color: #ecf0f1;">${description}</td>
                    </tr>
                </table>
            </body>
        </html>`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error while sending email: ' + error.message);
        }
        res.send('Report submitted successfully! Confirmation sent to your email.');
    });
});

// API endpoint to get the current visit count
app.get('/api/visits', (req, res) => {
    const userIP = req.ip;

    // Check if the IP address has visited within the last 24 hours
    if (shouldCountVisit(userIP)) {
        visitCount++;
        fs.writeFileSync(counterFile, visitCount.toString());
        ipLogs[userIP] = Date.now();
        fs.writeFileSync(ipLogFile, JSON.stringify(ipLogs));
    }

    res.json({ visitCount });
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.isLoggedIn) {
        return next();
    }
    res.redirect('/login');
};

// Root route
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Login route
app.get('/login', (req, res) => {
    if (req.session.isLoggedIn) {
        return res.redirect("/home.html");
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login POST route
app.post('/login', (req, res) => {
    const _username = req.body.username;
    const _password = req.body.password;

    // Set session variables
    req.session.username = _username;
    req.session.isLoggedIn = true;

    return res.redirect("/home.html");
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

// Home page - protected route
app.get('/home.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
