const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const Comment = require('../models/Comment')
const User = require('../models/User')

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id });
      res.render("profile.ejs", { posts: posts, user: req.user});
    } catch (err) {
      console.log(err);
    }
  },
  getProfileById: async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      const posts = await Post.find({ user: user.id });
        console.log()
      res.render("profile.ejs", { posts: posts, user: user, currentUser: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const posts = await Post.find().sort({ createdAt: "desc" }).lean();
      res.render("feed.ejs", { posts: posts, user: req.user, currentUser: req.user});
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      const comments = await Comment.find({post: req.params.id}).sort({ createdAt: 'desc'}).lean();
      res.render("post.ejs", { post: post, user: req.user, comments: comments, currentUser: req.user});
    } catch (err) {
      console.log(err);
    }
  },
  getUploadPage: (req,res) => {
        res.render('upload.ejs',{currentUser: req.user})
    },
  getProfilePictureUpload: (req,res) => {
        res.render('profilePictureUpload.ejs', {currentUser: req.user})
    },
  createPost: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      await Post.create({
        title: req.body.title,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        caption: req.body.caption,
        likes: 0,
        user: req.user.id,
      });
      console.log("Post has been added!");
      res.redirect("/profile/"+req.user.id);
    } catch (err) {
      console.log(err);
    }
  },
  updateProfilePicture: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      await User.findOneAndUpdate({_id: req.user.id},{
        image: result.secure_url,
        cloudinaryId: result.public_id,
      });
      console.log("Profile picture has been updated!");
      res.redirect("/profile/"+ req.user.id);
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await Post.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
};
