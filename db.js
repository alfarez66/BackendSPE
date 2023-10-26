const Pool = require("pg").Pool
const pool = new Pool({
    user: "postgres",
    password: "fais6666",
    host:"localhost",
    port: 5432,
    database: "spe"
})


module.exports = pool