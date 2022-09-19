const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const nodemailer = require("nodemailer");
const flash = require('connect-flash');
const session = require('express-session');


const contact_uri = "mongodb+srv://aman_khan0_o:2210@user-cart.uzqba.mongodb.net/ContactData?retryWrites=true&w=majority";

const cart_uri = "mongodb+srv://aman_khan0_o:2210@user-cart.uzqba.mongodb.net/UserCart?retryWrites=true&w=majority";


// Load Express to out app
const app = express();
const port = process.env.PORT || 8000;
var totalBill = 0;
var itemList = {};


// Creating a DB for Contact Storing
const contact_db = mongoose.createConnection(contact_uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

// stored in 'ContactData' database
const ContactModel = contact_db.model('feedback', new mongoose.Schema({
    name: String,
    contact: String,
    email: String,
    message: String
}));

// contact_db = mongoose.connection()
contact_db.on("error", console.error.bind(console, "connection error:"));
contact_db.once("open", function () {
    console.log("Contact DB Connection Successful!");
});


// Creating a DB for USer's Cart Storing
const cart_db = mongoose.createConnection(cart_uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

// stored in 'UserCart' database
const CartModel = cart_db.model('User_Cart', new mongoose.Schema({
    item_list: Object,
    total_bill: Number,
    username: String,
    address: String,
    email: String,
    card_type: String,
    card_num: String,
    card_expiry: Date,
    cvv: Number
}));

cart_db.on("error", console.error.bind(console, "connection error:"));
cart_db.once("open", function () {
    console.log("Cart DB Connection Successful!");
});


// For Sessions(user login/logout)
app.use(session({
    secret: 'veryverysecretkey123456789',
    resave: true,
    saveUninitialized: true
}));

// Define Static
app.use('/static', express.static('static'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// For displayingflash messages on feedback success or error
app.use(flash());
app.use((req, res, next) => {
    res.locals.errors = req.flash("error");
    res.locals.successes = req.flash("success");
    next();
});

// TO access form values we require these
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Define Mail Info
var transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "onlinemealsbyfoodies@gmail.com",
        pass: "onkarsanketamaan"
    }
});

app.get('/', (req, res) => {
    res.status(200).render('index.pug');
});

app.get('/home', (req, res) => {
    res.status(200).render('index.pug');
});

app.get('/groceries', (req, res) => {
    res.status(200).render('groceries.pug');
});

app.get('/vegetables', (req, res) => {
    res.status(200).render('vegetables.pug');
});

app.get('/fruits', (req, res) => {
    res.status(200).render('fruits.pug');
});

app.get('/contact', (req, res) => {
    res.status(200).render('index.pug');
});

app.get('/payment', (req, res) => {
    res.status(200).render('payment-form.pug', { bill: totalBill, cartlist: itemList });
});

app.post('/payment', (req, res) => {
    if (totalBill == 0) {
        req.flash("error", "Cart Empty! Add items in the cart before buying.");
        res.render("payment-form.pug", { errors: req.flash("error") });
    }
    else {
        var cart = new CartModel();
        cart.item_list = itemList;
        cart.total_bill = totalBill;
        cart.username = req.body.name;
        cart.address = req.body.address;
        cart.email = req.body.email;
        cart.card_type = req.body.card_type;
        cart.card_num = req.body.cardno;
        cart.card_expiry = req.body.exp_date;
        cart.cvv = req.body.cvv;

        cart.save();
        req.flash("success", "Thanks for Shopping from Foodies. Please Visit again!");
        res.render("payment-form.pug", { successes: req.flash("success") });

        itemList = {};
        totalBill = 0;
    }
});

app.post('/add', (req, res) => {
    let flag = true;
    for (let item in itemList) {
        if (item == req.body.item) {
            flag = false;
            let count = +itemList[req.body.item].split("*")[1] + 1;
            itemList[req.body.item] = `${req.body.price} * ${count}`;
        }
    }
    if (flag) {
        itemList[req.body.item] = req.body.price + " * 1";
    }
    totalBill += +req.body.price;

    res.redirect(req.rawHeaders[31].slice(req.rawHeaders[31].lastIndexOf("/")));
});

app.post('/contact', (req, res) => {
    var data = new ContactModel(req.body);
    data.save();

    // Data of Mail to be sent
    message = {
        from: `${req.body.email}`,
        to: "2019bcs035@sggs.ac.in, 2019bcs077@sggs.ac.in, 2019bcs118@sggs.ac.in",
        subject: `MyOnlineVegies feedback by ${req.body.name}`,
        text: `Message : ${req.body.message} \nContact Number : ${req.body.contact} \nfrom : ${req.body.email}`
    };

    // Sending the Mail
    transport.sendMail(message, function (err, info) {
        if (err) {
            req.flash("error", "Failed to Send the Mail, as Heroku blocks the smtp services.");
            res.render("index.pug", { errors: req.flash("error") });
        } else {
            req.flash("success", "Thanks for the Feedback. We will reach out to you soon!");
            res.render("index.pug", { successes: req.flash("success") });
        }
    });

});

app.get('/construction', (req, res) => {
    res.status(200).render('construction.pug');
})

app.listen(port, () => {
    console.log(`Server started at port ${port}`);
});



// Updates