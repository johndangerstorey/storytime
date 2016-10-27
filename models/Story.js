const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const storySchema = require('./schemas/storySchema');
const Story = mongoose.model('Story', storySchema);
module.exports = Story;
