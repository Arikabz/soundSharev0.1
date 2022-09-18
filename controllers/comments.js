const Comment = require('../models/Comment');

module.exports = {
    createComment: async (req,res) =>{
        try {

            await Comment.create({
                userId: req.user.id,
                userName: req.user.userName,
                comment: req.body.comment,
                likes: 0,
                post: req.params.id,
            });
            console.log("Coment has been added!");
            res.redirect("/post/" + req.params.id);
        } catch (err) {
            console.log(err);
        }
    },
    likeComment: async (req, res) => {
        try {
            await Comment.findOneAndUpdate(
                { _id: req.params.commentId },
                {
                    $inc: { likes: 1},
                }
            );
            console.log('Comment likes + 1');
            res.redirect('/post/'+req.params.id);
        } catch (err){
            console.log(err)
        }
    },
    deleteComment: async (req,res) => {
        try{
            //find comment by import {} from id
            //delete from db
            await Comment.remove({_id: req.params.commentId});
            console.log('Comment removed');
            res.redirect(`/post/${req.params.id}`)
        } catch (err){
            console.log(err)
        }
    }
}
