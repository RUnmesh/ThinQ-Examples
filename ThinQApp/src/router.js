const express = require('express');
var router = express.Router();
const userInfo = require('./userInfo')
const messageAction = require('./messageAction')
const message = require('./message');
const { sequelize } = require('../models/database');
const thinq = require('@gnowledge/thinq_lib')

router.get('/' , function(req, res) {
    global.args.node.id().then((info)=>{
        global.args.db.User.findOne({where: {ipfs: info.id}}).then((info)=>{
            if(info==null)
                res.render('login')
            else
                res.redirect('/contacts')
        })
    })
})

router.post('/init' , async function(req , res){
    let init_info = req.body
    // userInfo.createUserRecord(init_info , res)
    thinq.thinQ.register(init_info, global.args).then((result) => {
        console.log('RESULT = ' + result)
        res.redirect('/contacts')
    })
    global.args.node.id().then((info)=>{
        documentPath='/ratings/' + info.id.toString() + '.txt'
        global.args.node.files.write(documentPath, Buffer.from(info.id.toString()+'|0|0'), {
            create: true,
            parents: true
        }, (err, res) => {
            if(err) {
                console.log("--------------------------Error in inserting file " + err.message)
            } 
            else {
                global.args.node.files.stat(documentPath, (err, respon) => {
                    console.log('Stat Result = ' + JSON.stringify(respon))
                    hash = respon.hash
                    console.log('File Hash = ' + hash)            
                    global.args.db.User.update({ratinghash:hash,rating:'0'},{where: {ipfs:info.id}}).then((result)=> {
                        console.log("results of filehash is :",result)
                    })
                })
            }
        })
    })
})

router.get('/contacts' , function(req , res){
    global.args.node.id().then((info)=>{
        global.args.db.User.findOne({where : {ipfs:info.id}}).then((result)=>{
            global.args.node.get(result.dataValues.bio).then(([bio])=>{
                res.render("addressbook" , {filehash:result.dataValues.filehash , name:result.dataValues.name , type:result.dataValues.type , bio:bio.content.toString()})
            })
        })
    })
})


router.get('/sentRequests' , (req , res)=>{
    thinq.serviceRequest.sentRequests(global.args).then((result) => {
        result['requestType'] = "Sent"
        res.render('request.ejs' , result)
    })
})

router.get('/cRequests' , (req , res)=>{
    thinq.serviceRequest.createdcRequests(global.args).then((result) => {
        result['requestType'] = "Created"
        res.render('request.ejs' , result)
    })
})

router.get('/c_sp_Requests' , (req , res)=>{
    thinq.serviceRequest.createdspRequests(global.args).then((result) => {
        result['requestType'] = "SP Created"
        res.render('request.ejs' , result)
    })
})

router.get('/spackRequests' , (req , res)=>{
    thinq.serviceRequest.spackRequests(global.args).then((result) => {
        result['requestType'] = "SP Acknowledged"
        res.render('request.ejs' , result)
    })
})

router.get('/cackRequests' , (req , res)=>{
    thinq.serviceRequest.cackRequests(global.args).then((result) => {
        result['requestType'] = "Consumer Acknowleged"
        res.render('request.ejs' , result)
    })
})

router.get('/pendingRequests' , (req , res)=>{
    thinq.serviceRequest.pendingRequests(global.args, 50, 0).then((result) => {
        result['requestType'] = "Pending"
        res.render('request.ejs' , result)
    })
})


router.get('/getAddress' , async function(req , res){
    let nodeid = await global.args.node.id()
    console.log("Node id is:",nodeid['id'])
    global.args.db.User.findAll({}).then((contacts)=>{
        let promises = []
        let flag
        if(contacts.length==0)
            res.json([])
        for(let i=0 ; i<contacts.length ; i++) {
            contacts[i] = contacts[i].dataValues
            promises.push(global.node.get(contacts[i].bio))
        }
        for(let i=0 ; i<contacts.length ; i++) {
            let responses = []
            // contacts[i] = contacts[i].dataValues
            documentPath = '/ratings/' + contacts[i].ipfs + '.txt'
            global.args.node.files.read(documentPath
                , (err, res) => {
                    if(err) {
                        console.log("Error in reading file for addressbook:",err.toString())
                   } 
                   else {
                    console.log("the response of read is:",res)
                    responses.push(res)
                    Promise.all(responses).then((results)=>{
                        console.log("Results are",results[0].toString())
                        prevrating=results[0].toString()
                        if(prevrating !== undefined)
                        {   
                            contacts[i].rating = prevrating.split("|")[1].toString()
                            console.log("Rating passed form getAddress is:",contacts[i].rating)
                            global.args.db.User.update({rating:contacts[i].rating},{where: {ipfs:contacts[i].ipfs}}).then((result)=>{
                                // console.log("results of filehash is :",result)
                            })
                        }
                        else
                        {   
                            console.log("Entering else condition in getAddress")
                        }
                    })
                }
        })
    }
        Promise.all(promises).then((bios)=>{
            for(let i=0; i<contacts.length ; i++)
                {
                contacts[i].bio = bios[i][0].content.toString()
                console.log("Rating passed form getAddress final is:",contacts[i].rating)
                }
                // contacts = contacts.filter((value , index , arr)=>{
                //     return !(value.ipfs==nodeid.id)
                // })
            res.json(contacts)
        
        })
    })
})

router.post('/addAddress' , function(req , res) {
    thinq.thinQ.addUser(req.body.id, req.body.name, global.args).then((user_info) => {
        console.log(JSON.stringify(user_info))
        res.json(user_info)
    })
})

router.post('/addRequest' , function(req , res){
    console.log("Here " + req.body.ipfs)
    thinq.serviceRequest.addRequests(req.body.ipfs, global.args).then(() => {
        res.json({success:true})
    })
})

router.post('/updateBio', (req, res) => {
    let updatedBio = req.body.bio
    thinq.thinQ.updateInfo({
        'bio': updatedBio
    }, global.args).then(() => {
        res.json(updatedBio)
    })
})

router.get('/updateType' , (req , res)=>{
    global.args.node.id().then((info)=>{
        global.args.db.User.findOne({where:{ipfs:info.id}}).then((user)=>{
            global.args.node.get(user.dataValues.filehash).then(([file])=>{
                let user_info = JSON.parse(file.content.toString())
                user_info.type = user_info.type==1? 2 : 1
                global.args.node.add(JSON.stringify(user_info)).then(([stat])=>{
                    global.args.db.User.update({filehash:stat.hash.toString() , type:user_info.type} , {where:{ipfs:info.id}}).then((result)=>{
                        thinq.messaging.broadcastMessageToAddressBook({
                            sender: info.id,
                            action: messageAction.UPDATE,
                            message: stat.hash.toString(),
                            messageType: 'Type'
                        }).then((result)=>{
                            res.json({type:user_info.type})
                        })
                    })
                })
            })
        })
    })
})

router.post('/deleteRequest' , (req , res)=>{
    thinq.serviceRequest.deleteRequests(req.body.sender, global.args).then(() => {
        res.json({success : true})
    })
})

router.post('/createcRequest' , function(req , res){
    thinq.serviceRequest.createcRequests(req.body.sender, global.args).then(() => {
        res.json({success : true})
    })
})

router.post('/sp_ack_cRequest' , function(req , respond){
    thinq.serviceRequest.sp_ack_request(req.body.sender, req.body.userRating, '/ratings/' + req.body.sender + '.txt', global.args).then(() => {
        respond.json({success : true})
    })
})

router.post('/c_ack_cRequest' , function(req , respond){
    thinq.serviceRequest.c_ack_request(req.body.sender, req.body.userRating, '/ratings/' + req.body.sender + '.txt', global.args).then(() => {
        respond.json({success : true})
    })
})

router.post('/spcreatecRequest' , function(req , res){
    thinq.serviceRequest.spcreatecRequests(req.body.sender, global.args).then(() => {
        res.json({success : true})
    })
})


module.exports = router
