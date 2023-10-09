let express = require('express');
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users.model');
const mongoose = require('mongoose');
router.get('/', helper.authenticateToken, async(req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token.userid && mongoose.Types.ObjectId.isValid(req.token.userid)){
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token.userid).lean();
        if (userData && userData != null){
        }else{
            return responseManager.badrequest({ message: 'Invalid token to get user profile, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get user profile, please try again' }, res);
    }
});
module.exports = router;