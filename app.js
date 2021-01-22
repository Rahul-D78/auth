const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const session = require('express-session');
// const passport = require('passport');
// const passportLocalMongoose = require('passport-local-mongoose');

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));


// app.use(session({
//     secret: "our little secret",
//     resave: false,
//     saveUninitialized: false
// }));

// app.use(passport.initialize());
// app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser:true, useUnifiedTopology:true}).then(() => {
    console.log('connection established with db');
}).catch((e) => {
    console.log('connection fails' + e);
});
mongoose.set('useCreateIndex', true);


const userSchema = new mongoose.Schema({
    password:String,
    email: String
});

// userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);


app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/register', (req, res) => {
    
    let newUser = new User({
        password: req.body.password,
        email: req.body.username
    }) 
    newUser.save()
    .then(() => {
        res.render('secrets')
    }).catch((e) => {
        res.redirect('/register')
    })
})

app.post('/login', (req, res) => {
    const userName = req.body.username
    const pass = req.body.password

    const user = User.findOne({email: userName}, (e, foundUser) => {
        if(e) throw e
        else {
            if(foundUser) {
              if(foundUser.password === pass) {
                  res.render('secrets')
              }
            }
        }
    })
})

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
// passport.use(User.createStrategy());
 
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// app.get('/', (req, res) => {
//     res.render('home');
// });

// app.get('/login', (req, res) => {
//     res.render('login');
// });

// app.get('/register', (req, res) => {
//     res.render('register');
// });

// app.get('/secrets', (req, res) => {
   
//     if(req.isAuthenticated()){
//         res.render('secrets')
//     } 
//     res.redirect('/login');
// })

// app.post("/register", function(req, res) {

    
//  });
 

const PORT = process.env.PORT || 3000

app.listen(PORT, (req, res) => {
    console.log(`server is running on http://localhost:3000`);
})