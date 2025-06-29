const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");

const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });

router
    .route("/")
    .get(wrapAsync(listingController.index))   //index route
    .post(                                  //create route
        isLoggedIn,
        validateListing,
        upload.single("listing[image]"),
        wrapAsync(listingController.createListing)
    );

//note: new route should be before show route 
// otherwise /listings/new-> this 'new' might be treated as ':id'
//new route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
    .route("/:id")
    .get(wrapAsync(listingController.showListing))  //show rooute
    .put(                                           //update route
        isLoggedIn, 
        isOwner, 
        upload.single("listing[image]"),
        validateListing, 
        wrapAsync(listingController.updateListing))
    .delete(                                        //delete route
        isLoggedIn, 
        isOwner, 
        wrapAsync(listingController.destroyListing)
    );


//edit route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

//search route
router.get("/search",(req,res)=>{
    console.log(req.body);
    res.send("no match found.");
});

module.exports = router;