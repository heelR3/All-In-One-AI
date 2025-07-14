import express from 'express'
import { deleteCreation, getPublishedCreations, getUserCreations, toggleLikeCreation } from '../controllers/userController.js';
import { auth } from '../middlewares/auth.js';

const userRouter = express.Router();

userRouter.get('/get-user-creations', auth, getUserCreations)
userRouter.get('/get-published-creations', auth, getPublishedCreations)
userRouter.post('/toggle-like-creation', auth, toggleLikeCreation)
userRouter.delete('/delete-creation/:id', auth, deleteCreation);

export default userRouter;