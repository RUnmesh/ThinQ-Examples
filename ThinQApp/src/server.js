const express = require('express')
const app = express()
const bodyParser = require("body-parser")
const cors = require('cors')
const router = require('./router')
const http = require('http')
const ipfs = require('./ipfs')
const db = require('../models/database')
const path = require('path')
const Sequelize = require('sequelize')
const messageAction = require('./messageAction')
const messages = require('./message')
const thinq = require('@gnowledge/thinq_lib')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use("/", router)

let server = http.createServer(app)
server.listen(3000, async () => {
    thinq.thinQ.init({
        path: path.join(__dirname , 'ipfs/thinq/'),
        messageCallback: (decoded_msg) => {
            console.log('Inside own message listener')
        }
    }).then((args) => {
        global.node = args.node
        global.room = args.room
        global.args = args
    })
})

