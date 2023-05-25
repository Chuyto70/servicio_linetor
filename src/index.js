const express = require('express')
const bodyParser = require('body-parser')
const sql = require('mssql')
const { getConnection } = require('./service.js')
const cors = require('cors')
const app = express()   
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))

//Datos del usuario de PRUEBA
app.get('/', async (req,res)=>{
  try {
    const pool =  await getConnection()
  const {recordsets: propiedadesUser} = await pool.request().query`SELECT *
  FROM [FOXCLEA_TAREAS].[foxclea_tareas].[AV_PROPIEDADES]
  where ID_PROPIETARIO = 296`
  const {recordsets: propietarioUser} = await pool.request().query`SELECT *
  FROM [FOXCLEA_TAREAS].[foxclea_tareas].[AV_PROPIETARIOS]
  where ID_PROPIETARIO = 296`
  await sql.close()
  const user = {
    propietaro:propietarioUser[0][0],
    propiedades:propiedadesUser[0]
  }

  res.json(user)
  } catch (error) {
     res.status(400).json({
      ok:false,
      error:error
    })
  }

})
//Datos de reservas por ID de la propiedad
app.get('/reservas/:id', async(req, res) =>{
  let id = req.params.id
  try {
  let pool = await getConnection()    
  
  let { recordsets:reservas } = await pool.request().query`
  SELECT A.ID_RESERVA, A.FECHA_ENTRADA, A.FECHA_SALIDA, A.PRECIO, A.SUPLIMPIEZA, A.COMISION, A.ESTADO, A.PORCENTAJE_LINETOR, A.GASTOLIMPIEZAACOBRAR_PROPIETARIO, B.NOMBRE, B.APELLIDO FROM [FOXCLEA_TAREAS].[foxclea_tareas].[AV_RESERVAS] A
  INNER JOIN FOXCLEA_TAREAS.AV_CLIENTES B ON B.ID_CLIENTE = A.ID_CLIENTE
  WHERE A.id_propiedad = ${id}
  `
  await sql.close()

  res.json({data: reservas[0]})
  } catch (error) {
    res.status(400).json({
      ok:false,
      error:error
    })
  }
 
  
})

//Datos de la reserva por ID de la reserva
app.get('/facturas/reservas/:id', async (req, res)=>{
  const id =  req.params.id
  try {
  const pool = await getConnection()

  const {recordsets: reservas} = await pool.request().query`
  SELECT A.ID_RESERVA, A.fecha_entrada, A.fecha_salida, C.NOMBRE,C.APELLIDO, A.PRECIO, A.SUPLIMPIEZA, A.COMISION, A.PORCENTAJE_LINETOR, A.GASTOLIMPIEZAACOBRAR_PROPIETARIO, A.COMISION_IMPORTEYLIMPIEZA FROM FOXCLEA_TAREAS.AV_RESERVAS A
  INNER JOIN FOXCLEA_TAREAS.AV_CLIENTES C ON  C.ID_CLIENTE = A.ID_CLIENTE
  WHERE A.ID_RESERVA = ${id}
  `
   await sql.close()
  res.json({reservas:reservas[0]}) 
  } catch (error) {
    res.status(400).json({
      ok:false,
      error:error
    })
  }

})

//Facturas de la propiedad
app.get('/facturas/:id', async (req, res) => {
  const id = req.params.id
  try {
  const pool = await getConnection()

  let { recordsets:facturas } = await pool.request().query`
  SELECT A.CONTRA_ID, A.CLIENTE_ID,F.NOMBRE AS NOMBRE_CLIENTE, B.ID_PROPIEDAD, B.NOMBRE_PROPIEDAD, C.NOMBRE AS NOMBRE_PROPIETARIO, 
     E.NUMERO, E.fecha, E.concepto1, J.fe_cobro, J.asienco, J.ptadebe, J.ptahaber, G.CONCEPTO FROM FOXCLEA_TAREAS.BMCONTRA A 
    INNER JOIN FOXCLEA_TAREAS.AV_PROPIEDADES B ON B.ID_PROPIEDAD = A.PROPIEDAD_ID 
    INNER JOIN FOXCLEA_TAREAS.AV_PROPIETARIOS C ON C.ID_PROPIETARIO = B.ID_PROPIETARIO
    INNER JOIN FOXCLEA_TAREAS.bmfactu E ON E.CLIENTE_ID = A.CLIENTE_ID
    INNER JOIN FOXCLEA_TAREAS.BMCLIENTE F ON F.CLIENTE_ID = A.CLIENTE_ID
    INNER JOIN FOXCLEA_TAREAS.bmdiario J ON J.factura = E.NUMERO
    INNER JOIN FOXCLEA_TAREAS.BMFDETALLE G ON G.FACTURA = E.NUMERO
    WHERE C.ID_PROPIETARIO = ${id} AND J.ptadebe > 0 AND E.fecha >= DATEFROMPARTS(2023, 4, 1)
  `
   await sql.close()
  res.json({facturas:facturas[0]})
  } catch (error) {
    res.status(400).json({
      ok:false,
      error:error
    })
  }
  

})

//LOGIN DE USUARIO
app.post('/', async (req,res)=>{
  let reqBody = {id:req.body.user, password:req.body.password}
  console.log('HOLA REQ')
  console.log(reqBody)
  try {
  let pool = await getConnection()

  const {recordsets: propietarioUser} = await pool.request().query`
  SELECT ID_PROPIETARIO, NOMBRE, APELLIDO, USUARIO_ID, DIRECCION, PROVINCIA, CODIGO_POSTAL, TELEFONO, MOVIL, EMAIL, WEBUSER, WEBPASS
  FROM [FOXCLEA_TAREAS].[foxclea_tareas].[AV_PROPIETARIOS]
  where WEBUSER = ${reqBody.id}`

 
  let dataUser = propietarioUser[0][0]

  if(dataUser){
    if(reqBody.password.trim() ===  dataUser.WEBPASS.trim() ){
     const {recordsets: propiedadesUser} = await pool.request().query`SELECT ID_PROPIEDAD, ID_PROPIETARIO, NOMBRE, NOMBRE_PROPIEDAD, DIMENSIONES, MEDIDA, DORMITORIOS, BAÑOS, PRECIO, TELEFONO, MOVIL, ESTRELLAS, DIRECCION, codigo_postal, CORREO_PRINCIPAL, PAIS, USUARIO_ID, EMAIL, PROVINCIA
      FROM [FOXCLEA_TAREAS].[foxclea_tareas].[AV_PROPIEDADES]
      where ID_PROPIETARIO = ${dataUser.ID_PROPIETARIO}`
       await sql.close()
     const user = {
     propietaro:propietarioUser[0][0],
     propiedades:propiedadesUser[0]
   }
     res.status(200).json({user})
    }else{
       await sql.close()
     res.status(403).json({ok:false, message:'Usuario o contraseña incorrecta'})
    }
    }else{
      
     res.status(403).json({ok:false, message:'Usuario no existe'})
    
    }
 

  } catch (error) {
    res.status(400).json({
      ok:false,
      error:error
    })
  }

})

app.listen(2727, () => {
    console.log('servidor en el puerto 2727')
})