/*
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    config = require('../../config/config'),
    Schema = mongoose.Schema;


/**
 * Message Schema
 */
var MessageSchema = new Schema({
    title: String,
    author: String,
    body: String,
}, {
    capped: {
        size: 1024,
        max: 1000,
        autoIndexId: true
    }
});

/**
 * Validations
 */
// ArticleSchema.path('title').validate(function(title) {
//     return title.length;
// }, 'Title cannot be blank');

/**
 * Statics
 */
// ArticleSchema.statics = {
//     load: function(id, cb) {
//         this.findOne({
//             _id: id
//         }).populate('user', 'name username').exec(cb);
//     }
// };

mongoose.model('Message', MessageSchema);