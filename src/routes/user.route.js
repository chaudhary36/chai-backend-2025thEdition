import { Router } from "express";
import { changeAccountDetails, changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        },
    ]),
    registerUser,

);

router.route("/login").post(loginUser);

// securedRoutes

router.route("/logout").post( verifyJWT , logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT , getCurrentUser)
router.route("/update-account").patch(verifyJWT, changeAccountDetails)


router.route("/avatar").patch(verifyJWT , upload.single('avatar') , updateUserAvatar)
router.route("/coverImage").patch(verifyJWT , upload.single('coverImage') , updateUserCoverImage)

router.route("/c/:username").get(verifyJWT , getUserChannelProfile)
router.route("/watchHistory").get(verifyJWT, getWatchHistory)


// completed on 20-08-2025 at 22:33 PM

export default router;