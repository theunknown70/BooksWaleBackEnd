const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-currency').loadType(mongoose);
const Currency = mongoose.Types.Currency;

const bookSchema = new Schema({
    description: {
        type: String,
        required: true,
        default: ''
    },
    image: {
        type: String,
        // required: true,
        default: ''
    },
    year: {
        type: String,
        required: true,
        default: ''
    },
    branch: {
        type: String,
        required: true,
        default: ''
    },
    price: {
        type: String,
        required: true,
        min: 0,
        default: ''
    },
    number: {
        type: String,
        required: true,
        default: ''    
    },
    college: {
        type: String,
        required: true,
        default: ''
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

var Books = mongoose.model('Book', bookSchema);

module.exports = Books;