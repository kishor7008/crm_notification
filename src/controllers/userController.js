const { isValidRequest, isValidEmail, isValidPwd, isValidPhone } = require('../utills/validation')
const Users = require('../models/userModel');
const Admin = require('../models/adminSchema')
const bcrypt = require('bcrypt');
const cookie = require('cookie');
const generateToken = require("../utills/generateToken")
const Leads = require("../models/leadsModel")
const EmployeeId = require("../models/employeeIdSchema")
// register Users
const userRegister = async (req, res) => {
    try {
        const newUser = req.body
        let { employeeId, name, email, mobile, password } = newUser
        if (!name || !email || !mobile || !password || !isValidRequest(newUser)) {
            return res.status(400).send({ status: false, Message: "All fields are required" })
        }
        const isUsed = await Users.findOne({ email: email })
        const alreadyUsedEmployeeId = await Users.findOne({ "employeeId": newUser.employeeId })
        console.log(alreadyUsedEmployeeId)
        const validEmployeeId = await EmployeeId.findOne({ "employeeId": newUser.employeeId })
        if (alreadyUsedEmployeeId) {
            return res.status(409).send({ status: false, Message: "This EmployeeId Already Used" })
        }
        if (!validEmployeeId) {
            return res.status(409).send({ status: false, Message: "This EmployeeId not valid" })
        }
        if (isUsed) {
            return res.status(409).send({ status: false, Message: "This email is already used" })
        }
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, Message: `Invalalid email ${email}` })
        } else if (!isValidPhone(mobile)) {
            return res.status(400).send({ status: false, Message: `Invalid mobile Number ${mobile}` })
        } else if (!isValidPwd(password)) {
            return res.status(400).send({ status: false, Message: "Password should be strong" })
        }
        password = await bcrypt.hashSync(newUser.password, 10)
        const savedUser = new Users({
            employeeId: newUser.employeeId,
            name: newUser.name,
            email: newUser.email,
            mobile: newUser.mobile,
            password: password
        })
        await savedUser.save()
        res.status(201).send({ status: true, savedUser })

    } catch (error) {
        res.status(500).send({ status: false, Error: error.message })
    }
};


// login employee

const userLogin = async (req, res) => {
    try {
        const registeredUser = req.body
        const { email, password } = registeredUser
        if (!email || !password) {
            return res.status(400).send({ status: false, message: "Email and Password is required" })
        }
        const isValidUser = await Users.findOne({ email: email })
        if (!isValidUser) {
            res.status(403).send({ status: false, message: "Invalid email or password" })
        }
        const validateUser = await bcrypt.compare(password, isValidUser.password);
        if (!validateUser) {
            return res
                .status(401)
                .send({ status: false, message: "Incorrect password" });
        } else {
            res.status(200).json({
                _id: isValidUser._id,
                employeeId: isValidUser.employeeId,
                name: isValidUser.name,
                email: isValidUser.email,
                mobile: isValidUser.mobile,
                token: generateToken(isValidUser._id)

            })

        }

    } catch (err) {
        console.log(err)
    }
}

// getting own profile
const myProfile = async (req, res) => {
    try {
        let response = await Users.findOne({ "_id": req.user._id })
        res.status(200).json({
            employeeID: response.employeeId,
            name: response.name,
            email: response.email,
            mobile: response.mobile,
        })
    } catch (error) {
        res.status(500).json(error)
    }
}



const employeeLeads = async (req, res) => {
    try {
        let responce = await Leads.find({ "employeeId": req.user.employeeId })
        console.log(responce)
        let leads = []
        for (let i = 0; i < responce.length; i++) {
            leads.push(responce[i].tasks[0])
        }
        res.json(leads)

    } catch (error) {
        res.status(500).json(error)
    }
}

// single leads of employee
const singleLead = async (req, res) => {
    try {
        let response = await Leads.findOne({ "tasks.email": req.body.email, "employeeId": req.user.employeeId })
        console.log(response.tasks[0].name)
        res.status(200).json(response)
    } catch (error) {
        res.status(500).json(error)
    }
}

//update status by employee pending
const statusUpdate = async (req, res) => {
    try {
        await Leads.updateOne({ "tasks.email": req.body.email, "employeeId": req.user.employeeId }, { $set: { "status": req.body.status } })
        res.status(200).json("updated status sucessful")
    } catch (err) {
        res.status(500).json(err)
    }
}


//update work by employee pending
const workUpdate = async (req, res) => {
    try {
        await Leads.updateOne({ "tasks.email": req.body.email, "employeeId": req.user.employeeId }, { $set: { "work": req.body.work } })
        res.status(200).json("updated status sucessful")
    } catch (err) {
        res.status(500).json(err)
    }
}
//label update
const labelUpdate = async (req, res) => {
    try {
        await Leads.updateOne({ "tasks.email": req.body.email, "employeeId": req.user.employeeId }, { $set: { "label": req.body.label } })
        res.status(200).json("updated label sucessful")
    } catch (err) {
        res.status(500).json(err)
    }
}
//reminder update
const reminderUpdate = async (req, res) => {
    try {
        await Leads.updateOne({ "tasks.email": req.body.email, "employeeId": req.user.employeeId }, { $set: { "reminder": req.body.reminder } })
        res.status(200).json("updated reminder sucessful")
    } catch (err) {
        res.status(500).json(err)
    }
}
//update to reminder
const logUpdate = async (req, res) => {
    try {
        await Leads.updateOne({ "tasks.email": req.body.email, "employeeId": req.user.employeeId }, { $set: { "logs": req.body.logs } })
        res.status(200).json("updated reminder sucessful")
    } catch (err) {
        res.status(500).json(err)
    }
}
//employee add status notinterested

const notInterested = async (req, res) => {
    try {
        await Leads.updateOne({ "tasks.email": req.body.email, "employeeId": req.user.employeeId }, { $set: { "status": "pending" } })

        setTimeout(async () => {
            let data = await Leads.findOne({ "tasks.email": req.body.email })
            if (data.status == "allocated") {
                res.json("admin send the lead to other employee")
                return;
            } else {
                let allUser = await Users.find()
                console.log(allUser)
                let data = await Leads.findOne({ "tasks.email": req.body.email })
                let random = Math.floor((Math.random() * allUser.length))
                console.log(random)
                console.log(allUser[random].id)
                let assignUser = new Leads({
                    employeeId: allUser[random].id,
                    assignTo: allUser[random].name,
                    tasks: data.tasks[0]
                })
                await assignUser.save()
                res.json(assignUser)
            }

        }, 5000)

    } catch (err) {
        res.status(500).json(err)
    }
}



module.exports = { userRegister, userLogin, employeeLeads, singleLead, statusUpdate, workUpdate, notInterested, myProfile, labelUpdate, reminderUpdate, logUpdate };