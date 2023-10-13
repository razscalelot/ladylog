let express = require('express');
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users/users.model');
const mongoose = require('mongoose');
router.get('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token._id && mongoose.Types.ObjectId.isValid(req.token._id)) {
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token._id).lean();
        if (userData && userData != null) {
            return responseManager.onSuccess('User profile', userData, res);
        } else {
            return responseManager.badrequest({ message: 'Invalid token to get user profile, please try again' }, res);
        }
    } else {
        return responseManager.badrequest({ message: 'Invalid token to get user profile, please try again' }, res);
    }
});
router.post('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token._id && mongoose.Types.ObjectId.isValid(req.token._id)) {
        const {name, goal, cycle, period_days, period_start_date, period_end_date, dob} = req.body;
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token._id).lean();
        if(userData){
            let obj = {
                name: name,
                goal: goal,
                cycle: cycle,
                period_days: period_days,
                period_start_date: period_start_date,
                period_end_date: period_end_date,
                dob: dob,
                updatedBy: new mongoose.Types.ObjectId(req.token._id)
            }
            await primary.model(constants.MODELS.users, userModel).findByIdAndUpdate(req.token.userid, obj);
            let updatedData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
            return responseManager.onSuccess('User profile updated successfully!', updatedData, res);
        }else{
            return responseManager.badrequest({message: 'Invalid token to update user profile, please try again'}, res);
        }
    } else {
        return responseManager.badrequest({message: 'Invalid token to update user profile, please try again'}, res);
    }
})
module.exports = router;