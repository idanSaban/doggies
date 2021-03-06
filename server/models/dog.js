const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dogSchema = new Schema({
    name: String,
    profilePic: String,
    gender: String,
    breed: String,
    size: String,
    birthday: Date
})

const Dog = mongoose.model('Dog', dogSchema)
module.exports = Dog
