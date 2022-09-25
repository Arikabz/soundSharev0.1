const cloudinary = require('../middleware/cloudinary');
const Post = require('../models/Post');
const Audio = require('../models/Audio');
const Comment = require('../models/Comment');
const User = require('../models/User');

module.exports = {
	async getProfile(request, res) {
		try {
			const audios = await Audio.find({user: request.user.id});
			res.render('profile.ejs', {audios, user: request.user});
		} catch (error) {
			console.log(error);
		}
	},
	async getProfileById(request, res) {
		try {
			const user = await User.findById(request.params.id);
			const audios = await Audio.find({user: request.params.id}).sort({createdAt: 'desc'}).lean();
			let likedAudios;
			await Promise.all(user.likedPosts.map(x => Audio.findById(x))).then(async values => {
				likedAudios = values;
                console.log(likedAudios)
			await Promise.all(likedAudios.map(x => User.findById(x.user))).then(values => {
                values.forEach((x,i) =>{
					likedAudios[i].defaultImg = x.image;
				})
			});
			});
			console.log();
			res.render('profile.ejs', {audios, likedAudios, user, currentUser: request.user});
		} catch (error) {
			console.log(error);
		}
	},
	async getFeed(request, res) {
		try {
			const audios = await Audio.find().sort({createdAt: 'desc'}).lean();
			const aUserIds = audios.map(x => x.user);
			await Promise.all(aUserIds.map(x => User.findById(x))).then(values => {
				for (const [i, x] of values.entries()) {
					audios[i].defaultImg = x.image;
				}
			});
			res.render('feed.ejs', {audios, user: request.user, currentUser: request.user});
		} catch (error) {
			console.log(error);
		}
	},
	async getPost(request, res) {
		try {
			const audio = await Audio.findById(request.params.id);
			const postUser = await User.findById(audio.user);
			const comments = await Comment.find({post: request.params.id}).sort({createdAt: 'asc'}).lean();
			const cUserIds = comments.map(x => x.userId);
			await Promise.all(cUserIds.map(x => User.findById(x))).then(values => {
				for (const [i, x] of values.entries()) {
					comments[i].userImg = x.image;
				}
			});
			res.render('post.ejs', {audio, postUser, comments, currentUser: request.user});
		} catch (error) {
			console.log(error);
		}
	},
	getUploadPage(request, res) {
		res.render('upload.ejs', {currentUser: request.user});
	},
	getProfilePictureUpload(request, res) {
		res.render('profilePictureUpload.ejs', {currentUser: request.user});
	},
	async getPostUpdate(request, res) {
		const audio = await Audio.findById(request.params.id);
		res.render('updateAudioPost.ejs', {currentUser: request.user, audio});
	},
	async createAudio(request, res) {
		try {
			// Upload image to cloudinary
			console.log(request.files);
			let customImg = 'none'; let
				customImgCloudinaryId = 'none';
			if (request.files.customImg) {
				const resultImg = await cloudinary.uploader.upload(request.files.customImg[0].path);
				customImg = resultImg.secure_url;
				customImgCloudinaryId = resultImg.public_id;
			}

			const result = await cloudinary.uploader.upload(request.files.audio[0].path, {resource_type: 'video'});

			await Audio.create({
				title: request.body.title,
				audio: result.secure_url,
				cloudinaryId: result.public_id,
				caption: request.body.caption,
				likes: 0,
				defaultImg: request.user.image,
				customImg,
				customImgCloudinaryId,
				user: request.user.id,
				userName: request.user.userName,
			});
			console.log('Audio has been added!');
			res.redirect('/profile/' + request.user.id);
		} catch (error) {
			console.log(error);
		}
	},
	async createPost(request, res) {
		try {
			// Upload image to cloudinary
			const result = await cloudinary.uploader.upload(request.file.path);

			await Post.create({
				title: request.body.title,
				image: result.secure_url,
				cloudinaryId: result.public_id,
				caption: request.body.caption,
				likes: 0,
				likedBy: [],
				user: request.user.id,
				userName: request.user.userName,
			});
			console.log('Post has been added!');
			res.redirect('/profile/' + request.user.id);
		} catch (error) {
			console.log(error);
		}
	},
	async updateAudioPostTest(request, res) {
		console.log(request.body.caption.trim());
	},
	async updateAudioPost(request, res) {
		try {
			// Upload image to cloudinary
			const audio = await Audio.findById(request.params.id);
			// Const result = await cloudinary.uploader.upload(req.file.path);
			console.log(request.body);
			let title = audio.title;
			let caption = audio.title;
			const formCaption = request.body.caption.trim();

			if (request.body.title != title) {
				title = request.body.title;
			}

			if (caption != formCaption) {
				caption = formCaption;
			}

			if (request.file) {
				await cloudinary.uploader.destroy(audio.customImgCloudinaryId);
				const newImg = await cloudinary.uploader.upload(request.file.path);
				console.log(newImg);
				await Audio.findOneAndUpdate({_id: request.params.id}, {
					title,
					caption,
					customImg: newImg.secure_url,
					customImgCloudinaryId: newImg.public_id,
				});
			} else {
				await Audio.findOneAndUpdate({_id: request.params.id}, {
					title,
					caption,
				});
			}

			console.log('Audio post has been updated!');
			res.redirect('/post/' + request.params.id);
		} catch (error) {
			console.log(error);
		}
	},
	async updateProfilePicture(request, res) {
		try {
			// Upload image to cloudinary
			const result = await cloudinary.uploader.upload(request.file.path);

			if (request.user.cloudinaryId) {
				await cloudinary.uploader.destroy(request.user.cloudinaryId);
			}

			await User.findOneAndUpdate({_id: request.user.id}, {
				image: result.secure_url,
				cloudinaryId: result.public_id,
			});
			console.log('Profile picture has been updated!');
			res.redirect('/profile/' + request.user.id);
		} catch (error) {
			console.log(error);
		}
	},
	async likeAudioPost(request, res) {
		try {
			if (request.user.likedPosts.includes(request.params.id)) {
				const newArray = request.user.likedPosts;
				newArray.splice(newArray.indexOf(request.params.id));
				await User.findOneAndUpdate({_id: request.user.id}, {
					likedPosts: newArray,
				});
			} else {
				const update = request.user.likedPosts;
				update.push(request.params.id);
				await User.findOneAndUpdate({_id: request.user.id}, {
					likedPosts: update,
				});
			}

			const audio = await Audio.findById(request.params.id);
			const newArray = audio.likedBy;
			if (audio.likedBy.includes(request.user.id)) {
				newArray.splice(newArray.indexOf(request.user.id));
			} else {
				newArray.push(request.user.id);
			}

			await Audio.findOneAndUpdate(
				{_id: request.params.id},
				{
					likes: newArray.length,
					likedBy: newArray,
				},
			);
			console.log('Liked and saved');
			console.log('saved post:' + request.user.likedPosts);
			res.redirect(`/post/${request.params.id}`);
		} catch (error) {
			console.log(error);
		}
	},
	async likePost(request, res) {
		try {
			await Post.findOneAndUpdate(
				{_id: request.params.id},
				{
					$inc: {likes: 1},
				},
			);
			console.log('Likes +1');
			res.redirect(`/post/${request.params.id}`);
		} catch (error) {
			console.log(error);
		}
	},
	async deletePost(request, res) {
		try {
			// Find post by id
			const audio = await Audio.findById({_id: request.params.id});
			// Delete image from cloudinary
			await cloudinary.uploader.destroy(audio.cloudinaryId);
			if (audio.customImg) {
				await cloudinary.uploader.destroy(audio.customImgCloudinaryId);
			}

			// Delete post from db
			await Audio.remove({_id: request.params.id});
			console.log('Deleted Post');
			res.redirect('/profile/' + request.user.id);
		} catch (error) {
			console.log(error);
			res.redirect('/profile/' + request.user.id);
		}
	},
};
