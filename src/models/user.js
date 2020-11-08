const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const mongoose = require('mongoose')
const validator =  require('validator')
const { Schema } = mongoose
const Task = require('./task')

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'User name is required'],
            trim: true
        }, 
        email: {
            type: String,
            unique: true,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
            validate(value) {
                if(!validator.isEmail(value)) {
                    throw Error("Invalid email")
                }
            }
        }, 
        password: { 
            type: String,
            required: [true, 'Password is required'],
            trim: true,
            minlength: 7
        },
        age: {
            type: Number,
            default: 0
        },
        avatar: {
            type: Buffer
        },
        tokens: [{
            token: {
                type: String,
                required: true
            }
        }]
    },{
        timestamps: true
    })

    userSchema.virtual('tasks', {
        ref: 'Task',
        localField: '_id',
        foreignField: 'owner'
    })


// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        await bcrypt.hash(this.password, 8).then((hashedPassword) =>{
            this.password = hashedPassword
        }).catch((error) =>{
            throw new Error('Error')
        })
    }
    next()
})

userSchema.pre('remove', async function (next) {
    await Task.deleteMany({ owner: this._id})
    next()
})

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}
userSchema.methods.getPublicData = function() {
    const user = this
    const userObject = user.toObject()
    
    delete userObject.tokens
    delete userObject.password
    delete userObject.avatar

    return userObject
}


userSchema.statics.verifyCredential = async (email, password) => {
    const user = await User.findOne({ email })

    if(!user) {
        throw new Error('Invalid..')
    }
    const isValidPassword =  await bcrypt.compare(password, user.password)
    if(!isValidPassword) {
        throw new Error('Invalid ....')
    }
    return user
}


const User = mongoose.model('User', userSchema)

module.exports = User