import mongoose, { Schema } from "mongoose";

const userSchema=new Schema({
    fullName:{
        type:String,
        required:true,
        trim:true,
        lowercase:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        lowercase:true
    },
    password:{
        type:String,
        required:[true,'Password is required']
    },
    avatar:{
        type:String,              //cloudinary
        required:true
    },
    coverImage:{
        type:String,              //cloudinary
    },
    refreshToken:{
        type:String
    },
    role:{
        type:String,
        enum:["Seller","Buyer"]
    }
},
{
    timestamps:true
}
)

userSchema.pre("save",async function(next) {
    if(!this.isModified("password")) return next();

    this.password=await bcrypt.hash(this.password,10)
    next();
})

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            fullName:this.fullName
        },
        process.env.REFRESH_TOKEN_SECERT,
        {
            expiresIn:process.env.Refresh_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateAcessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECERT,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)