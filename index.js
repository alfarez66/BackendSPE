const express = require('express')
const app = express()
const cors = require('cors')
const pool = require("./db")
const multer = require('multer')
const bcrypt = require('bcrypt')
const jwtUtils = require('./utils/jwtUtils')
const cookieParser = require('cookie-parser')


//middleware
app.use(cors({origin:'http://localhost:3000',credentials:true}))
app.use(express.json())
app.use(cookieParser())

// set up multer storage
const storage = multer.memoryStorage()
const upload = multer({storage: storage})
//Route








app.post('/register', upload.single('image') ,async(req, res) => {
    try{
        // registration logic
        const {name, email, contact, password, access, date} = req.body
        
        //check the username

        const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email])

        if (userExist.rows.length > 0) {
            return res.status(400).json({message: 'Email already exist'})
        }

        //Hast the password before storing
        const hashedPassword = await bcrypt.hash(password, 10) //hash password using bcrypt
        
        await pool.query(
            "INSERT INTO users (name, email, contact, password, access, date) VALUES($1, $2, $3, $4, $5, $6)",
            [name, email, contact, hashedPassword, access, date]
        )
        
        // create a JWT token for the user
        const user = {name}
        const token = jwtUtils.generateJwtToken(name)
        res.status(201).json({token})
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error'})
    }
})

app.post('/login' , upload.single('image') , async(req, res) => {
    try{
        // login  logic

        const { email, password } = req.body

        // find email
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email])

        if(user.rows.length === 0) {
            return res.status(401).json({message: 'Authentication failed'})
        }

        // compare password with stored hash
        const passwordMatch = await bcrypt.compare(password, user.rows[0].password)

        if(!passwordMatch){
            return res.status(401).json({message: 'Authentication failed'})
        }

        // Create a user object with only essential information
        const userForToken = { 
            id: user.rows[0].id,
            name: user.rows[0].name,
            email: user.rows[0].email,
            access: user.rows[0].access,
        }
        console.log(userForToken)
        // create a JWT token for the user
        const token = jwtUtils.generateJwtToken(userForToken)
        
        // set JWT token as an HTTP-only cookie
        console.log(token)
        // console.log(res.cookie('jwt', token, {httpOnly:true, secure:true,maxAge:24*60*60*1000})
        // )
        res.cookie('jwt', token, {httpOnly:true, secure:true,maxAge:24*60*60*1000})
        res.status(201).json({token})
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error'})
    }
})

app.get('/logout', (req,res)=> {
    // clear JwT token cookie to log out
    res.clearCookie('jwt');
    res.status(200).json({message:'Logged out'})
})

app.post("/inputUser", jwtUtils.verifyJwtToken , upload.single('image') ,async(req, res)=>{
    try{
        // console.log("Received Image Data:", req.file); // Add this line
        console.log("Other Request Data:", req.body); // Add this line

        const {name, email, contact, password, access, date} = req.body;
        // const image = req.file

        const newReport = await pool.query(
                "INSERT INTO users (name, email, contact, password, access, date) VALUES($1, $2, $3, $4, $5, $6)",
                [name, email, contact, password, access, date]
            )
            
        // check if image present
        // if(image){
        //     // convert image to base64 string 
        //     const base64Image = Buffer.from(image).toString('base64')

        //     // Insert the report into the database with the base64 image string
        //     const newReport = await pool.query(
        //         `INSERT INTO report (userId, date, description, status, image, location, assignee) VALUES($1, $2, $3, $4, $5, $6, $7);`,
        //         [userId, date, description, status, base64Image, location, assignee]
        //     )
        //     res.status(201).json(newReport)
        // } else {
        //     // insert without image
        //     const newReport = await pool.query(
        //         "INSERT INTO report (userId, date, description, status, location, assignee) VALUES($1, $2, $3, $4, $5, $6)",
        //         [userId, date, description, status, location, assignee]
        //     )
        //     res.status(201).json(newReport)
        // }
        res.status(201).json(newReport)
    }
    catch(err){
        console.error(err.message)
        res.status(500).send(err.message)
    }
})


app.get('/account', jwtUtils.verifyJwtToken, async(req, res)=>{
    try{
        console.log("ture")
        // retrieve user data from JWT token
        const userData = jwtUtils.verifyJwtToken(req.headers.authorization.split(' ')[1])

        // fetch the username and user role from the database based on the user's email
        const user = await pool.query('SELECT name, access FROM users WHERE email = $1', [userData.email]);

        if(user.rows.length === 0 ){
            return res.status(404).json({message: 'User not found'})
        }

        res.status(200).json({
            name: user.rows[0].name,
            role: user.rows[0].access
        })
    } catch(error){
        console.error(error)
        res.status(500).json({message: 'Internal Server Error'})
    }
})

app.get("/users", async (req, res)=>{
    const reports = await pool.query("SELECT * FROM users;");
    console.log(reports.rows)
    res.status(200).json(reports)
})

app.post("/report", jwtUtils.verifyJwtToken , upload.single('image') ,async(req, res)=>{
    try{
        // console.log("Received Image Data:", req.file); // Add this line
        console.log("Other Request Data:", req.body); // Add this line

        const {userId, date, description, status, location, assignee,image } = req.body;
        // const image = req.file

        const newReport = await pool.query(
                "INSERT INTO report (userId, date, description, status,image, location, assignee) VALUES($1, $2, $3, $4, $5, $6, $7)",
                [userId, date, description, status, image, location, assignee]
            )
            
        // check if image present
        // if(image){
        //     // convert image to base64 string 
        //     const base64Image = Buffer.from(image).toString('base64')

        //     // Insert the report into the database with the base64 image string
        //     const newReport = await pool.query(
        //         `INSERT INTO report (userId, date, description, status, image, location, assignee) VALUES($1, $2, $3, $4, $5, $6, $7);`,
        //         [userId, date, description, status, base64Image, location, assignee]
        //     )
        //     res.status(201).json(newReport)
        // } else {
        //     // insert without image
        //     const newReport = await pool.query(
        //         "INSERT INTO report (userId, date, description, status, location, assignee) VALUES($1, $2, $3, $4, $5, $6)",
        //         [userId, date, description, status, location, assignee]
        //     )
        //     res.status(201).json(newReport)
        // }
        res.status(201).json(newReport)
    }
    catch(err){
        console.error(err.message)
        res.status(500).send(err.message)
    }
})

// get report

app.get("/reports", async (req, res)=>{
    const reports = await pool.query("SELECT * FROM report;");
    console.log(reports.rows)
    res.status(200).json(reports)
})

app.get("/reports/:userId", async(req, res)=>{
    const userId = req.params.userId;
    const report = await pool.query("SELECT * FROM report WHERE userId = $1", [userId]);
    if (!report.length){
        res.status(404).json({ message: "No Report found" })
        return
    }
    res.status(200).json(report[0]);
})

// update report

// delete report

app.listen(5000, ()=>{
    console.log("server has started on port 5000")
})