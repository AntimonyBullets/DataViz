import mongoose, {Schema} from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const adminSchema = new Schema({
    username:{
        type: String,
        required: true, 
        unique: true, 
        lowercase: true,
        trim: true,
        index: true
    },
    password:{
        type:String,
        required: [true, "Password is required"]
    },
}, {timestamps: true});

adminSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next(); 
    } 
    this.password = await bcrypt.hash(this.password, 12);
    next();
}) 

adminSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password); 
};

adminSchema.methods.generateAccessToken = function (){
    return jwt.sign(
        {
            _id: this._id,
            username: this.username, 
        },
        process.env.ADMIN_ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ADMIN_ACCESS_TOKEN_EXPIRY
        }
    )
}
export const Admin = mongoose.model('Admin', adminSchema);