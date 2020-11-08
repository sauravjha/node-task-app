const mongoose = require('mongoose');
require('./db/mongoose')
const Task = require('./models/task')
const userRouter = require('./router/user')
const taskRouter = require('./router/task')
const express = require('express');
const app = express()

const port = process.env.PORT

app.use(express.json())

app.use(userRouter)
app.use(taskRouter)

app.get('/', function (req, res) {
    res.send('Hello World')
})


app.listen(port, () => {
    console.log('Task application running.....', port)
})

