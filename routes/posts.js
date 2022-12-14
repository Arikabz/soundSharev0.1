const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const postsController = require("../controllers/posts");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Post Routes - simplified for now
router.get("/:id", ensureAuth, postsController.getPost);
router.get("/getUpdatePost/:id", ensureAuth, postsController.getPostUpdate);

router.post("/createPost", upload.single("file"), postsController.createPost);
//Audio Post
const audioUpload = upload.fields([{name: 'audio', maxCount: 1}, {name: 'customImg', maxCount: 1}])
router.post("/createAudioPost", audioUpload, postsController.createAudio);

router.put("/likePost/:id", postsController.likeAudioPost);
router.post("/updateProfilePicture",upload.single("file"), postsController.updateProfilePicture);
router.put("/updateAudioPost/:id",upload.single("customImg"), postsController.updateAudioPost);

router.delete("/deletePost/:id", postsController.deletePost);

module.exports = router;
