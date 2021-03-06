require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate')
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(session({
    secret: "our little secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser:true, useUnifiedTopology:true}).then(() => {
    console.log('connection established with db');
}).catch((e) => {
    console.log('connection fails' + e);
});
mongoose.set('useCreateIndex', true);


const userSchema = new mongoose.Schema({
    password:String,
    email: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser())
// passport.deserializeUser(User.deserializeUser())

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENTID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
}, (accessToken, refreshToken, profile, cb) => {
    console.log(profile);
    User.findOrCreate({googleId: profile.id}, (err, user) => {
        return cb(err, user)
    });
}));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
});  

app.get('/submit', (req, res) => {
    if(req.isAuthenticated()) {
        res.render('submit')
    }else {
        res.redirect('/login')
    }
})

// app.get('/secrets', (req, res) => {
//     if(req.isAuthenticated()) {
//         res.render('secrets')
//     }else {
//         res.redirect('/login')
//     }
// })

app.get('/secrets', (req, res) => {
    
    User.find({secret: {$ne: null}}, (err, foundUsers) => {
        if(err){
            throw err
        }
        if(foundUsers) {
            res.render('secrets', {allSecrets: foundUsers})
        }
    })
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/submit', (req, res) => {
   User.findById(req.user.id, (err, foundUser) => {
       if(err) throw err
       if(foundUser) {
           //we are seeting founduser secret field to the submitted user secret
           foundUser.secret = req.body.secret;
           foundUser.save()
           .then(() => {
               res.redirect('/secrets')
           }).catch((e) => {
               console.log(e);
           })
       }
   })
})

app.post('/register', (req, res) => {
    
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if(err) { 
        res.redirect('/register')
        }else {
         passport.authenticate('local') (req, res, () => {
            res.redirect('/secrets');
         })
        }
    })
  
})

app.post('/login', (req, res) => {
   
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, (err) => {
        if(err) throw err
        passport.authenticate('local')(req,res, () => {
            res.redirect('/secrets')
        })
    })
})

app.get('/logout', (req, res) => {
    req.logOut()
    res.redirect('/')
})

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
// passport.use(User.createStrategy());
 
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

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