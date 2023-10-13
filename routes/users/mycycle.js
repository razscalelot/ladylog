const express = require('express');
const router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const userModel = require('../../models/users/users.model');
const symptomModel = require('../../models/admin/symptoms.model');
const userSymptomsModel = require('../../models/users/userSymptoms.model');
const mongoose = require('mongoose');
const ayc = require('async');


function addDaysToTimestamp(timestamp, daysToAdd) {
    const millisecondsInADay = 24 * 60 * 60 * 1000;
    const millisecondsToAdd = daysToAdd * millisecondsInADay;
    const newTimestamp = timestamp + millisecondsToAdd;
    return newTimestamp;
};  

function isDateBetween(startTimestamp, endTimestamp, dateTimestamp) {
    const startDateObj = new Date(startTimestamp);
    const endDateObj = new Date(endTimestamp);
    const dateToCheckObj = new Date(dateTimestamp);
    return startDateObj <= dateToCheckObj && dateToCheckObj <= endDateObj;
};
  

router.get('/', helper.authenticateToken, async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.token._id && mongoose.Types.ObjectId.isValid(req.token._id)){
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token._id).lean();
        if (userData && userData != null){
            let symptoms = await primary.model(constants.MODELS.usersymptoms , userSymptomsModel).find({createdBy:userData._id , date: {$gte: userData.period_start_date , $lte: userData.period_end_date}}).select('-createdBy -updatedBy -createdAt -updatedAt -__v').lean();
            if(symptoms.length > 0){
                let details_of_symptoms = [];
                // ayc.forEachSeries(symptoms , (symptom , next_symptom) => {
                //     ayc.forEachSeries(symptom.birth_controls , (birth_control , next_birthcontrol) => {
                //         console.log("birth control :",birth_control);
                //         (async () => {
                //             console.log("birth_control :",birth_control);
                //             let data = await primary.model(constants.MODELS.symptoms , symptomModel).findById(birth_control);
                //             console.log("data :",data);
                //             next_birthcontrol();
                //         })().catch((error) => { });
                //     });
                //     next_symptom();
                // });
                for(const symptom of symptoms){
                    let obj = {};
                    obj._id = symptom._id;
                    obj.date = symptom.date;
                    obj.birth_controls = [];
                    obj.pains = [];
                    obj.bleeding_flows = [];
                    obj.moods = [];
                    obj.avg_sleeps = [];
                    obj.sexual_experiences = [];
                    for(const birth_control of symptom.birth_controls){
                        let data = await primary.model(constants.MODELS.symptoms , symptomModel).findById(birth_control).select('_id symptom_type name svg').lean();
                        obj.birth_controls.push(data);
                    }
                    for(const pain of symptom.pains){
                        let data = await primary.model(constants.MODELS.symptoms , symptomModel).findById(pain).select('_id symptom_type name svg').lean();
                        obj.pains.push(data);
                    }
                    for(const bleeding_flow of symptom.bleeding_flows){
                        let data = await primary.model(constants.MODELS.symptoms , symptomModel).findById(bleeding_flow).select('_id symptom_type name svg').lean();
                        obj.bleeding_flows.push(data);
                    }
                    for(const mood of symptom.moods){
                        let data = await primary.model(constants.MODELS.symptoms , symptomModel).findById(mood).select('_id symptom_type name svg').lean();
                        obj.moods.push(data);
                    }
                    for(const avg_sleep of symptom.avg_sleeps){
                        let data = await primary.model(constants.MODELS.symptoms , symptomModel).findById(avg_sleep).select('_id symptom_type name svg').lean();
                        obj.avg_sleeps.push(data);
                    }
                    for(const sexual_experience of symptom.sexual_experiences){
                        let data = await primary.model(constants.MODELS.symptoms , symptomModel).findById(sexual_experience).select('_id symptom_type name svg').lean();
                        obj.sexual_experiences.push(data);
                    }
                    details_of_symptoms.push(obj);
                }
                let data = {
                    period_start_date: userData.period_start_date,
                    period_end_date: userData.period_end_date,
                    next_period_date: addDaysToTimestamp(userData.period_start_date , userData.cycle),
                    symptoms: details_of_symptoms
                }
                return responseManager.onSuccess('My cycle' , data , res);
            }else{
                let data = {
                    period_start_date: userData.period_start_date,
                    period_end_date: userData.period_end_date,
                    next_period_date: addDaysToTimestamp(userData.period_start_date , userData.cycle),
                }
                return responseManager.onSuccess('My cycle' , data , res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid token to get user, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get user, please try again' }, res);
    }
});

router.post('/editDate' , helper.authenticateToken , async (req , res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if(req.token._id && mongoose.Types.ObjectId.isValid(req.token._id)){
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token._id).lean();
        if(userData && userData != null){
            const {period_start_date , period_end_date} = req.body;
            if(period_start_date && period_end_date){
                return responseManager.onSuccess('Date update successfully...!' , 1 , res);
            }else{
                return responseManager.badrequest({ message: 'Invalid data to update date, please try again' }, res)
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid token to get user, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get user, please try again' }, res); 
    }
});

router.post('/addSymptoms' , helper.authenticateToken , async (req , res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if(req.token._id && mongoose.Types.ObjectId.isValid(req.token._id)){
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let userData = await primary.model(constants.MODELS.users, userModel).findById(req.token._id).lean();
        if(userData && userData != null){
            const {date , birth_control , pain , bleeding_flow , mood , avg_sleep , sexual_experience} = req.body;
            if(isDateBetween(userData.period_start_date , userData.period_end_date , date)){
                let obj = {
                    date: date,
                    birth_controls: birth_control,
                    pains: pain,
                    bleeding_flows: bleeding_flow,
                    moods: mood,
                    avg_sleeps: avg_sleep,
                    sexual_experiences: sexual_experience,
                    createdBy: userData._id
                }
                await primary.model(constants.MODELS.usersymptoms , userSymptomsModel).create(obj);
                return responseManager.onSuccess('Symptoms add successfully...!' , 1 , res);
            }else{
                return responseManager.badrequest({ message: 'Invalid date, please try again' }, res);
            }
        }else{
            return responseManager.badrequest({ message: 'Invalid token to get user, please try again' }, res);
        }
    }else{
        return responseManager.badrequest({ message: 'Invalid token to get user, please try again' }, res);
    }
});

module.exports = router;