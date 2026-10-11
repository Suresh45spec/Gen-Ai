const router=require('express');
const authRouter=router();

const authController=require('../controllers/auth.controller');
const authMiddleware=require('../middleware/auth.middleware');
// @route POST /api/auth/register
// @desc Register a new user
// @access Public

authRouter.post('/register',authController.registerUserController);

// @route POST /api/auth/login
// @desc Login a user
// @access Public

authRouter.post('/login',authController.loginUserController);

// @route POST /api/auth/logout
// @desc Add current JWT to the blacklist and clear the auth cookie
// @access Public
authRouter.post('/logout',authController.logoutUserController);

/**
 * @route GET /api/auth/get-me
 * @description get the current logged in user details
 * @access private
 */
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController);

module.exports=authRouter;