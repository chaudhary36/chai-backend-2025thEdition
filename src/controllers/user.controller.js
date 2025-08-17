import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const registerUser = asyncHandler(async (req, res) => {
    
    // get user details from frontend 
    // validation - not empty
    // check if user is already exists: username or email
    // check for images  , check for avatar (sepcially)
    // upload them to cloudinary , avatar 
    // create new user object  - create entry in database 
    // check if user is created or not then remove below
    // remove the password and the refresh token from createdUser
    // At final stage you have to just return the created user .
       
    const {username , email , fullName , password } = req.body;

    if([username , email , password , fullName].some((field) => field?.trim() === "" )){
        throw new ApiError(400 , "All fields are required!")
    }

    const exsitingUser = await User.findOne({
        $or: [{email} , {username}]
    })

    if(exsitingUser){
        throw new ApiError(408 , "This email or Password is already exists! Try another!")
    }

    // check for images

    const avatarLocalFilePath = req.files?.avatar[0].path;
    // const coverImageLcoalFilePath = req.files?.coverImage[0]?.path;

    let coverImageLcoalFilePath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLcoalFilePath = req.files.coverImage[0].path
    }

    // console.log("req.files  is here: " ,req.files)

    if(!avatarLocalFilePath){
        throw new ApiError(404 , "Avatar is required!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalFilePath)
    const coverImage = await uploadOnCloudinary(coverImageLcoalFilePath)

    if(!avatar){
        throw new ApiError(409 , "Can't fetch avatar from cloudinary ! Try again to uplaod!")
    }    

    const newUser = await User.create({
        email, 
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        fullName
    });

    // check if this 'newUser' is successfully created or not?

    const createdUser = await User.findById(newUser._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500 , "Internal Server error Kindly resubmit your credentials to us!")
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "Congratulations! , New User is registred Successfully!")
    )
})


export {registerUser};