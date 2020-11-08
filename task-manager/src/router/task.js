const express = require('express')
const router = new express.Router()
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
require('../db/mongoose')
const Task = require('../models/task')



// router.post('/task', (req, res) => {
//     (new Task(req.body)).save().then((data) => {
//         res.send(data)
//     }).catch((e) => {
//         res.send(e)
//     })
// })

// router.get('/tasks', (req, res) => {
//     Task.find({}).then((data) => {
//         res.send(data)
//     }).catch((error) => {
//         res.send(error)
//     })
// })

// router.get('/task/:id', function (req, res) {

//     Task.findById(req.params.id).then((data) => {
//         res.send(data)
//     }).catch((error) => {
//         res.send(error)
//     })
// })

// router.patch('/task/:id', async (req, res) => {
//     const updates = Object.keys(req.body)
//     const allowUpdate = ['completed']
//     const isValidKeyToUpdate = updates.every((update) => allowUpdate.includes(update))

//     if (!isValidKeyToUpdate) {
//         res.status(400).send("Invalid parameter to update")
//     }
//     const _id = await req.params.id
//     try {
//         const user = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true })
//         if (!user) {
//             return res.status(400).send("Not Found")
//         }
//         res.send(user)
//     } catch (error) {
//         res.status(400).send('Update fail', error)
//     }
// })

// router.get('/taskDeleteAndDisplayCompletedTask/:id', function (req, res) {
//     Task.findOneAndDelete(req.params.id).then((data) => {
//         return Task.find({ completed: true })
//     }).then((completedTask) => {
//         res.send(completedTask)
//     }).catch((error) => {
//         res.send(error)
//     })
// })


router.post('/auth/task', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.get('/auth/tasks', auth, async (req, res) => {
    const match = {}

    if(req.query.completed) {
        match.completed = req.query.completed === 'true' ? true : false    
    }
    const sort = {}
    
    if(req.query.sortBy) {
        const sortBy = req.query.sortBy.split(':')
        sort[sortBy[0]] = sortBy[1] === 'desc' ? -1 : 1 
    }
    
    try {
        const user = req.user
        await user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort 
            }
        }).execPopulate()
        res.status(200).send(req.user.tasks)
    } catch (error) {
        res.status(500).send(error)
    }
    
})

router.get('/auth/task/:id', auth, async (req, res) => {
    const _id = req.params.id
    
    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if(!task) {
            res.status(400).send('NOT FOUND')
        }
        res.send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.patch('/auth/task/:id', auth,  async (req, res) => {
    const updates = Object.keys(req.body)
    const allowUpdate = ['completed']
    const isValidKeyToUpdate = updates.every((update) => allowUpdate.includes(update))

    if (!isValidKeyToUpdate) {
        res.status(400).send("Invalid parameter to update")
    }
    const _id = await req.params.id
    try {
        const user = await Task.findOneAndUpdate({_id, owner: req.user._id}, req.body, { new: true, runValidators: true })
        if (!user) {
            return res.status(400).send("Not Found")
        }
        res.send(user)
    } catch (error) {
        res.status(400).send('Update fail')
    }
})

router.delete('/auth/task/:id', auth,  async (req, res) => {
 
    const _id = await req.params.id
    try {

        const task = await Task.findByIdAndDelete({_id, owner: req.user._id})
        
        res.send(task)
    } catch (error) {
        res.status(400).send('Delete fail')
    }
})

module.exports = router