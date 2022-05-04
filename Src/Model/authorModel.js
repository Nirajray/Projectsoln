const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
  fname: {
    type: String,
    required:'First name is required',
    trim: true
  },
  lname: {
    type: String,
    required: 'Last name is required',
    trim: true
  },
  title: {
    type: String,
    required: 'Title is required',
    enum: ['Mr', 'Mrs', 'Miss']
  },
  email: {
    type: String,
    unique: true,
    lowercase:true,
    required:'Email address is required',
    validate:{
        validator: function (email){
            return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
        },
         message: 'Please enter a valid email', 
  }
},
  password: {
    type: String,
    trim:true,
    required: 'Password is required'
  }
}, { timestamps: true })


module.exports = mongoose.model('Author', authorSchema)