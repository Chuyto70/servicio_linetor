const sql = require('mssql')

const dbSettings = {
    user:`db_a379f5_linetor_admin` ,
    password:`Testing2022`,
    server:`SQL5070.site4now.net`,
    database:`db_a379f5_linetor`,
    options: {
    encrypt: false, 
    trustServerCertificate: false, 
     "enableArithAbort": true,
    cryptoCredentialsDetails: {
            minVersion: 'TLSv1'
        }
  },
  port:1433
}



const getConnection = async() =>{
  try {
    const pool = await sql.connect(dbSettings)
   
   return pool
   
  } catch (error) {
    console.log('Error en la base de datos')
    console.log(error)
  }
   
}


module.exports = {
  getConnection
}