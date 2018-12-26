const express = require('express')
const router = express.Router()
const User = require('../models/user')
const Garden = require('../models/garden')
const Post = require('../models/post')
const Comment = require('../models/comment')
const Event = require('../models/event')
const Dog = require('../models/dog')
// const request = require('request')
// const moment = require('moment')


//remove user 
router.delete("/user/:userId", function (req, res) {
  User.findByIdAndDelete(req.params.userId).exec(function (err, user) {
    console.log(user)
    res.send("removed")
  })
})
//sign in
router.post('/user', async function (req, res) {
  const user = await User.findOne({ email: req.body.email })
  console.log(user)
  if (user === null)
  {
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      gender: req.body.gender,
      birthday: req.body.birthday,
    })
    await newUser.save()
    res.send(newUser)
  } else
  {
    res.send()
  }
})
//log in
router.post('/login', async function (req, res) {
  console.log("someone is loging in")
  console.log(req.body)
  if (req.body.email && req.body.password)
  {
    const user = await User.findOne({ email: req.body.email }).populate('gardens')
    if (user.password === req.body.password)
    {
      res.send(user._id)
    } else
    {
      res.send()
    }

  } else
  {
    res.send(null)
  }
})
//get all user info
router.get('/user/:userId', function (req, res) {
  User.findById(req.params.userId)
    .populate('gardens posts')
    .exec(function (err, user) {
      res.send(user)
    })
})
//create comunity + join
router.post('/garden/:userId', async function (req, res) {
  const newGarden = new Garden({
    name: req.body.name,
    lat: req.body.lat,
    lon: req.body.lon,
    gardenPic: req.body.pic
  })
  await newGarden.save()
  const user = await User.findById(req.params.userId)
  await user.gardens.push(newGarden)
  await user.save()
  res.send(newGarden)
})
//join comunity
router.put('/user/garden/:userId/:gardenId', async function (req, res) {
  const user = await User.findById(req.params.userId).populate('gardens').exec()
  const garden = await Garden.findById(req.params.gardenId).populate('posts').exec()
  await user.gardens.push(garden)
  await user.save()
  res.send(garden)
})
//leave comunity
router.delete('/user/garden/:userId/:gardenId', function (req, res) {
  console.log("someone tries to leave a garden")
  User.findById(req.params.userId)
    .populate('gardens')
    .exec(async function (err, user) {
      user.gardens = user.gardens.filter(g => g._id != req.params.gardenId)
      await user.save()
      res.send(user)
    })
})
// get comunity
router.get('/garden/:gardenId', function (req, res) {
  Garden.findById(req.params.gardenId)
    .populate('posts calendar')
    .exec(function (err, garden) {
      res.send(garden)
    })
})
// post new post
router.post('/post/:userId/:gardenId', async function (req, res) {
  const post = new Post({
    user: req.params.userId,
    garden: req.params.gardenId,
    text: req.body.text,
    date: req.body.date
  })
  console.log(`new post: ${post.text}`)
  await post.save()
  await User.findByIdAndUpdate(req.params.userId,
    { $push: { posts: post } })
  await Garden.findByIdAndUpdate(req.params.gardenId,
    { $push: { posts: post } })
  res.send(post)
})

// //remove post
// router.delete('/post/:postId', async function (req, res) {
//   const post = await Post.findById(req.params.postId).populate('user garden').exec()
//   await User.findOneAndUpdate(post.user._id, { $pull: { posts: { _id: req.params.postId } } })
//   await Garden.findOneAndUpdate(post.garden._id, { $pull: { posts: { _id: req.params.postId } } })
//   // await post.delete()

// res.send([post.user, post.garden])
// })


//create and join event
router.post('/event/', async function (req, res) {
  const event = new Event({
    garden: req.body.gardenId,
    date: req.body.time,
    users: [req.body.userId]
  })
  await event.save()
  Garden.findById(req.body.gardenId)
    .populate('calendar')
    .exec(function (err, garden) {
      garden.calendar.push(event)
      garden.save().then(res.send(garden))
    })
})
//join event
router.put('/event/', async function (req, res) {
  Event.findById(req.body.eventId)
    .populate('users')
    .exec(function (err, event) {
      event.users.push(req.body.userId)
      event.save().then(res.send(event))
    })
})
// add comment
router.post('/comment/:userId/:postId', async function (req, res) {
  const comment = new Comment({
    user: req.params.userId,
    post: req.params.postId,
    text: req.body.text,
    date: req.body.date
  })
  console.log(`new comment: ${comment.text}`)
  await comment.save()
  await Post.findByIdAndUpdate(req.params.postId,
    { $push: { comments: comment } })
  res.send(comment)
})


//remove comment
// router.delete('/comment/:userId/:commentId', async function (req, res) {
//   const comment = await Comment.findById(req.params.commentId)

// })

/////////////////////////////////////////////////
router.get('/allposts', function (req, res) {
  Post.find({}).exec(function (err, posts) {
    res.send(posts)
  })
})
router.get('/allusers', function (req, res) {
  User.find({}).populate('posts gardens dogs')
    .exec(function (err, users) {
      res.send(users)
    })
})
router.get('/allgardens', function (req, res) {
  Garden.find({}).exec(function (err, gardens) {
    res.send(gardens)
  })
})
router.delete('/dog/:userId/:dogId', async function (req, res) {
  const user = await User.findByIdAndUpdate(req.params.userId, { $pull: { dogs: { _id: req.params.dogId } } })
    .populate('posts dogs gardens').exec()
  await Dog.findByIdAndDelete(req.params.dogId)
  res.send(user)
})
////////////////////  IMAGE UPLOAD ROUTES ///////////////////////////////////////////
//create Dog + dogPic
router.post('/dog/:userId', async function (req, res) {
  if (Object.keys(req.files).length != 0)
  {
    const fileName = req.files.sampleFile.name + Math.floor(Math.random() * 9999999999999999999)
    const sampleFile = req.files.sampleFile
    const uploadPath = __dirname + '/dist/uploads/' + sampleFile.name
    sampleFile.mv(uploadPath, function (err) {
      if (err)
      {
        return res.status(500).send(err)
      }
    })
  }

  const dog = new Dog({
    name: req.body.name,
    profilePic: fileName,
    gender: req.body.gender,
    breed: req.body.breed,
    size: req.body.size,
    birthday: req.body.birthday
  })
  await dog.save()

  const user = await User.findByIdAndUpdate(req.params.userId, { $push: { dogs: dog } }, { new: true }).populate('garden posts dogs')
  res.send(user)
})

// post profile pic
router.post('/upload/profile/:userId', function (req, res) {
  if (Object.keys(req.files).length == 0)
  {
    res.status(400).send('No files were uploaded.');
    return
  }
  const fileName = req.files.sampleFile.name + Math.floor(Math.random() * 9999999999999999999)
  const sampleFile = req.files.sampleFile
  const uploadPath = __dirname + '/dist/uploads/' + sampleFile.name
  sampleFile.mv(uploadPath, function (err) {
    if (err)
    {
      return res.status(500).send(err)
    }
  })
  const user = User.findByIdAndUpdate(req.params(req.params.userId), { profilePic: fileName }, { new: true })
    .populate('gardens posts')
    .exec()
  res.send(user)
})

// post garden pic
router.post('/upload/garden/:gardenId', function (req, res) {
  if (Object.keys(req.files).length == 0)
  {
    res.status(400).send('No files were uploaded.');
    return
  }
  const fileName = req.files.sampleFile.name + Math.floor(Math.random() * 9999999999999999999)
  const sampleFile = req.files.sampleFile
  const uploadPath = __dirname + '/dist/uploads/' + sampleFile.name
  sampleFile.mv(uploadPath, function (err) {
    if (err)
    {
      return res.status(500).send(err)
    }
  })
  const garden = Garden.findByIdAndUpdate(req.params(req.params.userId), { gardenPic: fileName }, { new: true })
    .populate('posts calendar')
    .exec()
  res.send(garden)
})

///////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////

module.exports = router