import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
       const user = await User.findById(userId);
       const accessToken = user.generateAccessToken();
       const refreshToken = user.generateRefreshToken();

       user.refreshToken = refreshToken;
       await user.save({validateBeforeSave: false});

       return{
        accessToken,
        refreshToken
       }
        
    } catch (error) {
        throw new ApiError(500 , "Failed to generate Access and Refresh Tokens!")
    }
}


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

const loginUser = asyncHandler(async (req , res) => {
    // get the email or username and password from frontend
    // validate that fields - not empty
    // check if user is already exists - email or username
    // if yes then check the password through bcrypt 
    // if everything done ! then generate the access and refresh token 
    // send cookies
    // final-login

    const { email , username , password } = req.body;


    // if (!email) {
    //     console.log('No found any email')
    // }else {
    //     console.log("email: " , email)
    // }

    if(!(username || email)){
        throw new ApiError(400 , "Email or Username is required!")
    };

    const existingUser = await User.findOne({
        $or: [{username} , {email}]
    });

    if(!existingUser){
        throw new ApiError(404, "User doesn't exist , Try to Register!")
    };

    const isPasswordValid = await existingUser.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Incorrect Password ! Try again.")
    };

    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(existingUser._id);

    const updatedExistingUser = await User.findById(existingUser._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken, options)
    .json(
        new ApiResponse(
            200 ,
            {
                user: updatedExistingUser , refreshToken , accessToken
            },
            "User is logged In Successfully!"
        )
    );        

});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

     const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200 , "User is logout Successfully!"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(399 , "No Refresh Token Found! ")
    }

   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
     );
 
     const user = await User.findById(decodedToken._id);
 
     if(!user){
         throw new ApiError(404, "User not found!")
     }
 
     if(incomingRefreshToken !== user?.refreshAccessToken){
         throw new ApiError(401, "Invalid Token or expired Token found!")
     }
 
     const options = {
         httpOnly: true,
         secure: true
     };
 
     const { accessToken , refreshToken } = await generateAccessAndRefreshTokens(user._id);
 
     return res
     .status(200)
     .cookie("accessToken" , accessToken, options)
     .cookie("refreshToken" , refreshToken, options)
     .json(
         new ApiResponse(
             200,
             {accessToken , refreshToken},
             "Access Token is refreshed successfully!"
         )
     );  
   } catch (error) {
     throw new ApiError(
            401,
            error?.message || "Invalid Refresh Token!"
        )
   }

});

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const {oldPassword , newPassword} = req.body;
    //finding the user

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Invalid Given Password !")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(
        new ApiResponse(200 , {} , "Password Changed Successfully!")
    )
})

const getCurrentUser = asyncHandler(async (req , res) => {
    return res
    .status(200)
    .json(200 , req.user , "User Fetched Successfully!")
});

const changeAccountDetails = asyncHandler(async (req, res) => {

    const {fullName, username} = req.body;

    if(!(fullName && username)){
        throw new ApiError(404 , 'All fields are required!')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                username: username
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(
        200 ,
        user,
        "Username and FullName updated successfully!"
    ))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalFilePath = req.file?.path

    if(!avatarLocalFilePath){
        throw new ApiError(404 , "Please upload file to update avatar!")
    };

    const responseAvatarOfCloud = await uploadOnCloudinary(avatarLocalFilePath);

    if(!responseAvatarOfCloud.url){
        throw new ApiError(400, "Error while uploading the avatar on cloudinary!")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: responseAvatarOfCloud.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "Avatar Update Successfully!"))
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const CVILocalFilePath = req.file?.path

    if(!CVILocalFilePath){
        throw new ApiError(404 , "Please upload file to update Cover-Image!")
    };

    const responseCVIOfCloud = await uploadOnCloudinary(CVILocalFilePath);

    if(!responseCVIOfCloud.url){
        throw new ApiError(400, "Error while uploading the Cover-Image on cloudinary!")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: responseCVIOfCloud.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "Cover-Image Update Successfully!"))
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    changeAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
};