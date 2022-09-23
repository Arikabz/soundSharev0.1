const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const Audio = require("../models/Audio");
const Comment = require('../models/Comment')
const User = require('../models/User')

module.exports = {
  getProfile: async (req, res) => {
    try {
      const audios = await Audio.find({ user: req.user.id });
      res.render("profile.ejs", {audios: audios, user: req.user});
    } catch (err) {
      console.log(err);
    }
  },
  getProfileById: async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      const audios = await Audio.find({ user: req.params.id }).sort({createdAt:'desc'}).lean();
        console.log()
      res.render("profile.ejs", { audios: audios, user: user, currentUser: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const audios = await Audio.find().sort({createdAt:'desc'}).lean();
      let aUserIds = audios.map(x=> x.user)
      await Promise.all(aUserIds.map(x=>{
                return User.findById(x)
            })).then((values)=>{
                    values.forEach((x,i)=>{
                        audios[i].defaultImg = x.image;
                    })
                })
      res.render("feed.ejs", { audios: audios,  user: req.user, currentUser: req.user});
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const audio = await Audio.findById(req.params.id);
      const postUser = await User.findById(audio.user)
      const comments = await Comment.find({post: req.params.id}).sort({ createdAt: 'asc'}).lean();
      let cUserIds = comments.map(x=> x.userId)
      await Promise.all(cUserIds.map(x=>{
                return User.findById(x)
            })).then((values)=>{
                    values.forEach((x,i)=>{
                        comments[i].userImg = x.image;
                    })
                })
      res.render("post.ejs", { audio: audio, postUser: postUser,  comments: comments, currentUser: req.user});
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
  createAudio: async (req, res) => {
    try {
      // Upload image to cloudinary
        console.log(req.files)
        var customImg, customImgCloudinaryId;
      if(req.files.customImg){
        const resultImg = await cloudinary.uploader.upload(req.files.customImg[0].path);
        customImg = resultImg.secure_url;
        customImgCloudinaryId = resultImg.public_id;

        }
      const result = await cloudinary.uploader.upload(req.files.audio[0].path,{resource_type: 'video'});

      await Audio.create({
        title: req.body.title,
        audio: result.secure_url,
        cloudinaryId: result.public_id,
        caption: req.body.caption,
        likes: 0,
        defaultImg: req.user.image,
        customImg: customImg,
        customImgCloudinaryId: customImgCloudinaryId,
        user: req.user.id,
        userName: req.user.userName,
      });
      console.log("Audio has been added!");
      res.redirect("/profile/"+req.user.id);
    } catch (err) {
      console.log(err);
    }
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
        userName: req.user.userName,
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

        if(req.user.cloudinaryId){
            await cloudinary.uploader.destroy(req.user.cloudinaryId);
        }

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
  likeAudioPost: async (req, res) => {
    try {
      await Audio.findOneAndUpdate(
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
      let audio = await Audio.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(audio.cloudinaryId);
      if(audio.customImg){
            await cloudinary.uploader.destroy(audio.customImgCloudinaryId)
        }
      // Delete post from db
      await Audio.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile/"+req.user.id);
    } catch (err) {
      console.log(err);
      res.redirect("/profile/"+req.user.id);
    }
  },
};
