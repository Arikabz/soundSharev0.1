
const mongoose = require("mongoose");

const AudioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  audio: {
    type: String,
    require: true,
  },
  cloudinaryId: {
    type: String,
    require: true,
  },
  caption: {
    type: String,
    required: false,
  },
  likes: {
    type: Number,
    required: true,
  },
  defaultImg: {
    type: String,
    required: true,
  },
  customImg: {
    type: String,
    required: true,
  },
  customImgCloudinaryId: {
    type: String,
    required: true,
  },
  tags: {
    type: Array,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  userName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Audio", AudioSchema);
