const express = require('express')
const { getConnection } = require('./service.js')
const cors = require('cors')
const app = express()   
app.use(cors())

app.get('/', async (req,res)=>{
  const pool =  await getConnection()
  const {recordsets: propiedadesUser} = await pool.request().query`SELECT *
  FROM [db_a379f5_linetor].[dbo].[AV_PROPIEDADES]
  where ID_PROPIETARIO = 296`
  const {recordsets: propietarioUser} = await pool.request().query`SELECT *
  FROM [db_a379f5_linetor].[foxclea_tareas].[AV_PROPIETARIOS]
  where ID_PROPIETARIO = 296`

  const user = {
    propietaro:propietarioUser[0][0],
    propiedades:propiedadesUser[0]
  }

  res.json(user)
})
app.listen(2727, () => {
    console.log('servidor en el puerto 2727')
})