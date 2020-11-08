const express = require('express')
const router = new express.Router()
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const {sendWelComeEmail, sendGoodByeEmail} = require('../email/email');
require('../db/mongoose')
const User = require('../models/user')
const multer = require('multer')
const sharp = require('sharp')

// Size limit to 1 MB.
const upload = multer( {
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, callBack) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)/)) {
            return callBack(new Error('Please upload jpg|jpeg|png file for avatar'))
        }
        callBack(undefined, true)
    }
} )

router.get('/test', auth,  (req, res) =>{
    res.send("From diffrent app.....")
})


router.post('/user', async (req, res) => {
    const user = new User(req.body)
    try { 
        await user.save()
        const token = await user.generateAuthToken()
        sendWelComeEmail(user.email, user.name)
        res.send({user: user.getPublicData(), token})
    } catch (error) {
        res.status(500).send(error)
    }
})


router.get('/users', async (req, res) => {
    try {
        const user = await User.find({})
        res.send(user)
    } catch (error) {
        res.sendStatus(500).send(error)
    }
    // User.find({}).then((data) => {
    //     res.send(data)
    // }).catch((error) => {
    //     res.send(error)
    // })
})

router.get('/auth/users/me', auth, async (req, res) => {
    try {
        res.send(req.user.getPublicData())
    } catch (error) {
        res.send({error: error})
    }
})

router.post('/users/login', async (req, res) => {
    try {
    
        const user = await User.verifyCredential(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user: user.getPublicData(), token})
        
    } catch (error) {
        res.status(400).send(error)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((eachToken) =>{
            return req.token !== eachToken.token 
        })
        await req.user.save()
        console.log("loging out")
        res.send(req.user)
    } catch (error) {
        res.send({error: error})
    }
})

router.post('/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send(req.user)
    } catch (error) {
        res.send({error: error})
    }
})

router.get('/user/:id', async (req, res) => {
    const _id = await req.params.id
    try {
        const user = await User.findById(_id)
        if (!user) {
            return res.sendStatus(404).send("Not Found")
        }
        res.send(user)
    } catch (error) {
        res.sendStatus(500).send(error)
    }
})

router.patch('/user/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)

    const allowUpdate = ['name', 'email', 'age', 'password']
    const isValidKeyToUpdate = updates.every((update) => allowUpdate.includes(update))

    if (!isValidKeyToUpdate) {
        res.status(400).send("Invalid parameter to update")
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save().then(() =>{
            res.send(req.user)
        }).catch((error) =>{
            throw Error('Unable to Save')
        })
    } catch (error) {
        res.status(400)
    }
})


router.post('/user/me/avatar', auth, upload.single('avatar'), async (req, res) =>  {
    const updatebuffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer()
    req.user.avatar = updatebuffer
    await req.user.save()
    res.send('File uploaded')
}, (error, req, res, next) => {
    res.status(400)
})

router.get('/user/:id/avatar', async (req, res) => {
    const _id = req.params.id
    try {
        const user = await User.findById(_id)
        if (!user|| !user.avatar) {
            return res.status(404).send("Not Found")
        }
        res.set('Content-type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        res.status(500)
    }
})

router.get('/user/me/avatar', auth, (req, res) => {
    const user = req.user
    try {
        if (!user|| !user.avatar) {
            return res.sendStatus(404).send("Not Found")
        }
        res.set('Content-type', 'image/jpg')
        res.send(user.avatar)
    } catch (error) {
        res.sendStatus(500).send(error)
    }
})

router.delete('/user/me/avatar', auth , async(req, res) =>  {
    const user =  req.user
 
    user.avatar = undefined
    await user.save()
    res.send(user)
}, (error, req, res, next) => {
    res.status(400).send({
        error: error.message
    })
})

router.delete('/user', auth, async (req, res) => {
    
    try {
        const user = await req.user.remove()
        sendGoodByeEmail(user.email, user.name)
        res.send({user})
    } catch (error) {
        res.status(500).send(error)
    }

    // User.findById(req.params.id).then((data) => {
    //     res.send(data)
    // }).catch((error) => {
    //     res.send(error)
    // })
})



module.exports = router