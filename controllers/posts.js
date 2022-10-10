const cloudinary = require('../middleware/cloudinary');
const Post = require('../models/Post');
const Audio = require('../models/Audio');
const Comment = require('../models/Comment');
const User = require('../models/User');

module.exports = {
    //base getProfile function, depreciated
	async getProfile(request, res) {
		try {
			const audios = await Audio.find({user: request.user.id});
			res.render('profile.ejs', {audios, user: request.user});
		} catch (error) {
			console.log(error);
		}
	},
    //get profille by Id enables to get any user's profile by using their mongodb user _id property
	async getProfileById(request, res) {
		try {
            // 1. find user from request parameters
			const user = await User.findById(request.params.id);
            // 2. find all audios from the user in the current profile page, add them to array in descending order to show newest on top
			const audios = await Audio.find({user: request.params.id}).sort({createdAt: 'desc'}).lean();
            await audios.forEach(x=>{
                x.download = x.audio.split('upload').join('upload/fl_attachment');
            })
			let likedAudios;
            // 3. find all audios that are in the array property of likedAudios in the user's object in array form and declare likedAudios to equal this.
			await Promise.all(user.likedPosts.map(x => Audio.findById(x))).then(async values => {
				likedAudios = values;
            // 4. Find all the profile pictures of the likedAudios and add them to their defaultImg property for a current img
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
            // 1. find all audios (TODO: limit #of audios and request more on scroll)
			const audios = await Audio.find().sort({createdAt: 'desc'}).lean();
            // 2. get users from each audio
			const aUserIds = audios.map(x => x.user);
            // 3. find the user object to pull their current image for defaultImg
			await Promise.all(aUserIds.map(x => User.findById(x))).then(values => {
				for (const [i, x] of values.entries()) {
					audios[i].defaultImg = x.image;
                    audios[i].download = audios[i].audio.split('upload').join('upload/fl_attachment');
				}
			});
			res.render('feed.ejs', {audios, user: request.user, currentUser: request.user});
		} catch (error) {
			console.log(error);
		}
	},
    // get individual post page
	async getPost(request, res) {
		try {
            // 1. get audio from parameters
			const audio = await Audio.findById(request.params.id);
            audio.download = audio.audio.split('upload').join('upload/fl_attachment');
            // 2. get user obj
			const postUser = await User.findById(audio.user);
            // 3. get comments 
			const comments = await Comment.find({post: request.params.id}).sort({createdAt: 'asc'}).lean();
            // 4. map an array with the users of each comment
			const cUserIds = comments.map(x => x.userId);
            //5. get user obj and add the current pfp to each comment
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
	fileTypeError(request, res) {
		res.render('fileTypeError.ejs', {currentUser: request.user});
	},
	getProfilePictureUpload(request, res) {
		res.render('profilePictureUpload.ejs', {currentUser: request.user});
	},
    // get page to update current post if you are the user
	async getPostUpdate(request, res) {
		const audio = await Audio.findById(request.params.id);
		res.render('updateAudioPost.ejs', {currentUser: request.user, audio});
	},
	async createAudio(request, res) {
		try {
            // if multer sets req.fileValidationError == true, redirect to error page
            if(request.fileValidationError){
                res.redirect('/fileTypeError');
            } else {
			// Upload image to cloudinary
                // 1. set customImg property to 'none' so views can interpret
			let customImg = 'none'; 
            let customImgCloudinaryId = 'none';
                // 2. if a custom img is provided, upload it and set the variables to what cloudinary responds 
			if (request.files.customImg) {
				const resultImg = await cloudinary.uploader.upload(request.files.customImg[0].path);
				customImg = resultImg.secure_url;
				customImgCloudinaryId = resultImg.public_id;
			}

                // 3. Upload the audio, specifying that it is a video since cloudinary treat audios as video
			const result = await cloudinary.uploader.upload(request.files.audio[0].path, {resource_type: 'video'});

                // 4. create Audio object with the variables that were provided
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
            }
		} catch (error) {
			console.log(error);
            res.redirect('/fileTypeError')
		}
	},
    // old create post function, depreciated
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
	async updateAudioPost(request, res) {
		try {
            if(request.fileValidationError){
                res.redirect('/fileTypeError');
            } else {
			// 1. find the current Audio obj
			const audio = await Audio.findById(request.params.id);
            // 2. set baseline variables for current Audio ob
			let title = audio.title;
			let caption = audio.title;
            // 3. grab request caption, trim empty space
			const formCaption = request.body.caption.trim();

            // 4. compare new vs old properties
			if (request.body.title != title) {
				title = request.body.title;
			}

			if (caption != formCaption) {
				caption = formCaption;
			}

            // 5. if an image was provided, upload it to cloudinary
			if (request.file) {
				await cloudinary.uploader.destroy(audio.customImgCloudinaryId);
				const newImg = await cloudinary.uploader.upload(request.file.path);
                    // 5.1 update with customImg property
				await Audio.findOneAndUpdate({_id: request.params.id}, {
					title,
					caption,
					customImg: newImg.secure_url,
					customImgCloudinaryId: newImg.public_id,
				});
            // 5.2 if no image was provided, update without customImg property
			} else {
				await Audio.findOneAndUpdate({_id: request.params.id}, {
					title,
					caption,
				});
			}
			console.log('Audio post has been updated!');
			res.redirect('/post/' + request.params.id);
            }
		} catch (error) {
            res.redirect('/fileTypeError')
			console.log(error);
		}
	},
	async updateProfilePicture(request, res) {
		try {
			// 1. Upload image to cloudinary
			const result = await cloudinary.uploader.upload(request.file.path);

            // 2. if there was already a picture, destroy from cloudinary
			if (request.user.cloudinaryId) {
				await cloudinary.uploader.destroy(request.user.cloudinaryId);
			}

            // 3. update user object in db
			await User.findOneAndUpdate({_id: request.user.id}, {
				image: result.secure_url,
				cloudinaryId: result.public_id,
			});
			console.log('Profile picture has been updated!');
			res.redirect('/profile/' + request.user.id);
		} catch (error) {
            res.redirect('/fileTypeError')
			console.log(error);
		}
	},
	async likeAudioPost(request, res) {
		try {
            // 1. user has a likedPost array property
                // 1.1 if in the array, you already have the post that you're clicking like on, it means that you're toggling it (dislike)
			if (request.user.likedPosts.includes(request.params.id)) {
				const newArray = request.user.likedPosts;
                // 1.2 splice the post id from the array and update it on db
				newArray.splice(newArray.indexOf(request.params.id));
				await User.findOneAndUpdate({_id: request.user.id}, {
					likedPosts: newArray,
				});
			} else {
                // 1.1.2 if the array doesn't include the post you're liking, add it.
				const update = request.user.likedPosts;
				update.push(request.params.id);
                // 1.1.2.2 update in db
				await User.findOneAndUpdate({_id: request.user.id}, {
					likedPosts: update,
				});
			}

            // 2. Audio has a likedBy array property, find it for current post
			const audio = await Audio.findById(request.params.id);
			const newArray = audio.likedBy;
            // 2.1 if it includes the current user, splice it from array
			if (audio.likedBy.includes(request.user.id)) {
				newArray.splice(newArray.indexOf(request.user.id));
            // 2.2 if not, add it
			} else {
				newArray.push(request.user.id);
			}

            // 3. update Audio with the new array and # of likes == arr length
			await Audio.findOneAndUpdate(
				{_id: request.params.id},
				{
					likes: newArray.length,
					likedBy: newArray,
				},
			);
			console.log('Liked and saved');
			res.redirect(`/post/${request.params.id}`);
		} catch (error) {
			console.log(error);
		}
	},
    // old likePost function, depreciated
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
			// 1. Find post by id
			const audio = await Audio.findById({_id: request.params.id});
			// 2. Delete audio from cloudinary
			await cloudinary.uploader.destroy(audio.cloudinaryId);
            // 2.1 if it had a custom image, delete that as well
			if (audio.customImg!=='none') {
				await cloudinary.uploader.destroy(audio.customImgCloudinaryId);
			}

			// 3. Delete post from db
			await Audio.remove({_id: request.params.id});
			console.log('Deleted Post');
			res.redirect('/profile/' + request.user.id);
		} catch (error) {
			console.log(error);
			res.redirect('/profile/' + request.user.id);
		}
	},
};
