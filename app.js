if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const user = require("./models/user.js");


const dbUrl = process.env.ATLASDB_URL;
main()
    .then(()=>{
        console.log("Connecnted to DB")
    })
    .catch(err => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600,
});
store.on("error", ()=>{
    console.log("Error in MONGOSTORE session", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000,  //7 days
        maxAge: 7*24*60*60*1000,
        httpOnly: true,
    }
};

// app.get("/",(req,res)=>{
//     res.send("Root is working.")
// });

app.use(session(sessionOptions));//add these before all the listings route or review routes
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
   // console.log(res.locals);
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser", async (req,res)=>{
//     let fakeUSer = new User({
//         email: "student@gmail.com",
//         username: "xyz"
//     });
//     let newUser = await User.register(fakeUSer,"password");
//     res.send(newUser);
// });


//listings routes
app.use("/listings", listingRouter);
//Review routes
app.use("/listings/:id/reviews", reviewRouter);
//USer routes
app.use("/",userRouter);


//in new version use "/*splat" instead of just "*"
// app.all("/*splat",(req,res,next)=>{
//     next(new ExpressError(404, "Page Not Found!"));
// });

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err,req,res,next)=>{
    let { statusCode = 500, message = "Oops!!something went wrong!" } = err;
    res.status(statusCode).render("error.ejs",{message});
});

app.listen(8080,()=>{
    console.log(`Server is Listening to port no 8080`);
});