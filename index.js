const pool = require("./db")
const jwtUtils = require('./utils/jwtUtils')
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const cron = require('node-cron');
const fs = require('fs')

const multer = require('multer')
const express = require('express')
const cors = require('cors')
const app = express()

//middleware
app.use(cors({
    origin:'http://localhost:3000',credentials:true}))
app.use(express.json())
app.use(cookieParser())

// set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Sesuaikan dengan lokasi penyimpanan yang benar di backend
        cb(null, "./files");
    },
    filename: function (req, file, cb) {
        // Tambahkan format nama file jika diperlukan
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});
const upload = multer({ storage });
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

app.post("/inputUser", upload.array('image',10) ,async(req, res)=>{
    try{
        // console.log("Received Image Data:", req.file); // Add this line
        // console.log("Other Request Data:", req.body); // Add this line

        const {name, email, contact, password, access, date} = req.body;
        // const image = req.file

        const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email])

        if (userExist.rows.length > 0) {
            return res.status(400).json({message: 'Email already exist'})
        }

        //Hast the password before storing
        const hashedPassword = await bcrypt.hash(password, 10) //hash password using bcrypt

        const newReport = await pool.query(
                "INSERT INTO users (name, email, contact, password, access, date) VALUES($1, $2, $3, $4, $5, $6)",
                [name, email, contact, hashedPassword, access, date]
            )
            
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

app.get('/users/count', async (req, res) => {
    try {
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');
        res.status(200).json({ usersCount: usersCount.rows[0].count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/users/newThisMonth', async (req, res) => {
    try {
        const currentMonth = new Date().getMonth() + 1; // Get current month (January is 1)
        const currentYear = new Date().getFullYear(); // Get current year

        const usersCount = await pool.query('SELECT COUNT(*) FROM users WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2', [currentMonth, currentYear]);
        res.status(200).json({ newUsersThisMonth: usersCount.rows[0].count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.get('/account/:email', async (req, res) => {
    const email = req.params.email;

    try {
    const user = await pool.query('SELECT name, access FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
        name: user.rows[0].name,
        role: user.rows[0].access
    });
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update (Edit) User based on Email
app.put('/users/:email', async (req, res) => {
    const email = req.params.email;
    // Extract data from the request body
    const { name, contact, password, access, date } = req.body;

    try {
        const updatedUser = await pool.query(
            'UPDATE users SET name = $1, contact = $2, password = $3, access = $4, date = $5 WHERE email = $6',
            [name, contact, password, access, date, email]
        );
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Delete User based on Email
app.delete('/user/:email', async (req, res) => {
    const email = req.params.email;

    try {
        const deletedUser = await pool.query('DELETE FROM users WHERE email = $1', [email]);
        if (deletedUser.rowCount > 0) {
            // If a user was deleted (rowCount > 0), respond with a success message
            res.status(200).json({ message: 'User deleted successfully' });
        } else {
            // If no user was deleted, respond with a message indicating the user wasn't found
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});




// app.post("/report",upload.array('image',10) ,async(req, res)=>{
//     try{
//         // console.log("Received Image Data:", req.file); // Add this line
//         console.log("Other Request Data:", req.body); // Add this line
//         const image_path = "/files";
//         const {userId, date, description, status, location, assignee,image } = req.body;
//         // const image = req.file
//         console.log(upload.filename)
//         const newReport = await pool.query(
//                 "INSERT INTO report (userId, date, description, status,image_path, location, assignee) VALUES($1, $2, $3, $4, $5, $6, $7)",
//                 [userId, date, description, status, image_path, location, assignee]
//             )
            
//         // check if image present
//         // if(image){
//         //     // convert image to base64 string 
//         //     const base64Image = Buffer.from(image).toString('base64')

//         //     // Insert the report into the database with the base64 image string
//         //     const newReport = await pool.query(
//         //         `INSERT INTO report (userId, date, description, status, image, location, assignee) VALUES($1, $2, $3, $4, $5, $6, $7);`,
//         //         [userId, date, description, status, base64Image, location, assignee]
//         //     )
//         //     res.status(201).json(newReport)
//         // } else {
//         //     // insert without image
//         //     const newReport = await pool.query(
//         //         "INSERT INTO report (userId, date, description, status, location, assignee) VALUES($1, $2, $3, $4, $5, $6)",
//         //         [userId, date, description, status, location, assignee]
//         //     )
//         //     res.status(201).json(newReport)
//         // }
//         res.status(201).json(newReport)
//     }
//     catch(err){
//         console.error(err.message)
//         res.status(500).send(err.message)
//     }
// })

// get report

app.post("/report", upload.array('image', 10), async (req, res) => {
    try {
        console.log(req.body);
        // Mendapatkan data dari request
        const { userId, date, description, status, location, assignee } = req.body;
        const newReport = await pool.query(
            "INSERT INTO report (userId, date, description, status, image_path, location, assignee) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING reportId",
            [userId, date, description, status, "", location, assignee]
        );
        console.log(newReport.rows[0]); // Periksa struktur objek hasil query
        const reportId = newReport.rows[0].reportid; // Perhatikan penulisan "reportid" (sesuai dengan hasil query)
        console.log(reportId);
        const images = req.files;

        if (images && images.length > 0) {
            for (const [index, image] of images.entries()) {
                const image_path = `\\files\\report_${reportId}\\image_${index + 1}_${Date.now()}_${image.originalname}`;

                // Membuat direktori jika belum ada
                const directoryPath = __dirname + `\\files\\report_${reportId}`;
                if (!fs.existsSync(directoryPath)) {
                    fs.mkdirSync(directoryPath);
                }

                // Tambahkan log untuk menampilkan path image
                console.log("Image Path:", __dirname + image_path);

                // Gunakan image.path untuk menulis file ke dalam sistem file
                fs.writeFileSync(__dirname + image_path, fs.readFileSync(image.path));

                await pool.query(
                    "UPDATE report SET image_path = $1 WHERE reportId = $2",
                    [image_path, reportId]
                );
            }
        }

        res.status(201).json({ message: "Report and images saved successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send(err.message);
    }
});








app.get("/reports", async (req, res)=>{
    const reports = await pool.query("SELECT * FROM report;");
    // console.log(reports.rows)
    res.status(200).json(reports)
})

app.get('/reports/count', async (req, res) => {
    try {
        const reportsCount = await pool.query('SELECT COUNT(*) FROM report');
        res.status(200).json({ reportsCount: reportsCount.rows[0].count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/reports/newThisMonth', async (req, res) => {
    try {
        const currentMonth = new Date().getMonth() + 1; // Get current month (January is 1)
        const currentYear = new Date().getFullYear(); // Get current year

        const reportsCount = await pool.query('SELECT COUNT(*) FROM report WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2', [currentMonth, currentYear]);
        res.status(200).json({ newReportsThisMonth: reportsCount.rows[0].count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



// Update (Edit) Report
app.put("/reports/:reportId", async (req, res) => {
    const reportId = req.params.reportId;
    const { date, description, status, location, assignee, image } = req.body;

    try {
        const updatedReport = await pool.query(
            "UPDATE report SET date = $1, description = $2, status = $3, image = $4, location = $5, assignee = $6 WHERE reportId = $7",
            [date, description, status, image, location, assignee, reportId]
        );
        res.status(200).json({ message: "Report updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Delete Report
app.delete("/reports/:reportId",  async (req, res) => {
    const reportId = req.params.reportId;

    try {
        const deletedReport = await pool.query("DELETE FROM report WHERE reportId = $1", [reportId]);
        res.status(200).json({ message: "Report deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


app.get("/reports/:userId", async(req, res)=>{
    const userId = req.params.userId;
    const report = await pool.query("SELECT * FROM report WHERE userId = $1", [userId]);
    if (!report.length){
        res.status(404).json({ message: "No Report found" })
        return
    }
    res.status(200).json(report[0]);
})

// Fetching data from the completeness_score table
app.get('/completeness_scores', async (req, res) => {
    try {
        const completenessScores = await pool.query('SELECT * FROM report_completeness');
        res.status(200).json(completenessScores.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Function to recalculate and update completeness scores for reports
const recalculateCompletenessScores = async () => {
    try {
        console.log('Recalculating completeness scores...');
        const reportCompletenessData = await pool.query(`
            SELECT reportId, date,
                (CASE
                    WHEN NULLIF(description, '') IS NOT NULL THEN 1 ELSE 0 END +
                    CASE
                    WHEN NULLIF(status, '') IS NOT NULL THEN 1 ELSE 0 END +
                    CASE
                    WHEN image IS NOT NULL THEN 1 ELSE 0 END +
                    CASE
                    WHEN NULLIF(location, '') IS NOT NULL THEN 1 ELSE 0 END +
                    CASE
                    WHEN NULLIF(assignee, '') IS NOT NULL THEN 1 ELSE 0 END +
                    CASE
                    WHEN date IS NOT NULL THEN 1 ELSE 0 END) / 6.0 AS completeness_score
            FROM report
        `);

        for (const report of reportCompletenessData.rows) {
            const { reportId, date, completeness_score } = report;
            if (reportId && date && completeness_score !== null) {
                // Check if the reportId already exists in the report_completeness table
                const existingReport = await pool.query('SELECT reportId FROM report_completeness WHERE reportId = $1', [reportId]);

                if (existingReport.rows.length > 0) {
                    // Update completeness score if the record exists
                    await pool.query('UPDATE report_completeness SET date = $1, completeness_score = $2 WHERE reportId = $3', [date, completeness_score, reportId]);
                } else {
                    // Insert new record if the reportId doesn't exist
                    await pool.query('INSERT INTO report_completeness (reportId, date, completeness_score) VALUES ($1, $2, $3)', [reportId, date, completeness_score]);
                }
            }
        }
        console.log('Completeness scores recalculated.');
    } catch (error) {
        console.error('Error recalculating completeness scores:', error);
    }
};



// Schedule the task to run every day at midnight
// cron.schedule('0 0 * * *', async () => {
//     console.log('Cron job started');
//     await recalculateCompletenessScores();
//     console.log('Cron job finished');
// });
// 5 minutes

cron.schedule('*/60 * * * *', async () => {
    console.log('Cron job started');
    await recalculateCompletenessScores();
    console.log('Cron job finished');
});

// Start the Express server
app.listen(5000, ()=>{
    console.log("server has started on port 5000")
})