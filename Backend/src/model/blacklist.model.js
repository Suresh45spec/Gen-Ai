const mongoose = require('mongoose');
const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [ true, 'Token is required']
    },
    // Store the creation time so MongoDB TTL index can expire the document
    createdAt: {
        type: Date,
        default: Date.now,
        // Automatically remove documents after 3600 seconds (1 hour) — matching JWT lifetime
        expires: 3600
    }
});

const tokenblacklistModel = mongoose.model('Blacklist', blacklistSchema);
module.exports = tokenblacklistModel;