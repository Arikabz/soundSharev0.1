const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const homeController = require("../controllers/home");
const postsController = require("../controllers/posts");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Main Routes - simplified for now
router.get("/", homeController.getIndex);
router.get("/profile", ensureAuth, postsController.getProfile);
router.get("/profile/:id", ensureAuth, postsController.getProfileById);
router.get("/feed", ensureAuth, postsController.getFeed);
router.get("/upload", ensureAuth, postsController.getUploadPage);
router.get("/profilePictureUpdate", ensureAuth, postsController.getProfilePictureUpload);
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);

router.get("/fileTypeError", postsController.fileTypeError);

module.exports = router;
