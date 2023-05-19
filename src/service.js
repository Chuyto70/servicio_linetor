const sql = require('mssql')

const dbSettings = {
    user:`FOXCLEA_TAREAS` ,
    password:`JACINTO2014`,
    server:`dbprod01.dyndns-server.com`,
    database:`FOXCLEA_TAREAS`,
     options: {
    encrypt: false, 
    trustServerCertificate: false, 
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