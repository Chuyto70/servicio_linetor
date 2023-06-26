const express = require('express')
const bodyParser = require('body-parser')
const sql = require('mssql')
const { getConnection } = require('./service.js')
const cors = require('cors')
const { getDataScrapping } = require('./utils/getDataScrapping.js')
const app = express()   
const axios = require('axios');


app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json());


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
    ORDER BY fecha DESC
  `
   await sql.close()

let facturasUnicas = [
    ]
    
facturas[0].map(fact => {

let ind = facturasUnicas.findIndex(obj => obj.CONCEPTO === fact.CONCEPTO);

let factAsienco = fact.asienco;
let factConcepto = fact.CONCEPTO;
let unicoAsienco = ind !== -1 ? facturasUnicas[ind].asienco : null;
let unicoConcepto = ind !== -1 ? facturasUnicas[ind].CONCEPTO : null;

switch (true) {
case ind === -1:
facturasUnicas.push(fact);
break;

case factAsienco !== 0 && unicoAsienco === 0:
facturasUnicas[ind] = fact;
break;

case factAsienco !== 0 && unicoAsienco !== 0:
if (factConcepto !== unicoConcepto) {
facturasUnicas.push(fact);
}
break;

default:
console.log('PRIMER ELSE');
break;
}
});


facturas[0].map(fact=>{
  let ind = facturasUnicas.findIndex(obj=>obj.CONCEPTO === fact.CONCEPTO)
  console.log(ind)
  if(ind !== -1){
    console.log(fact.CONCEPTO +" asienco: "+ fact.asienco)
    if((facturasUnicas[ind].asienco === 0 && fact.asienco !==0) || 
        (facturasUnicas[ind].asienco === 0 && fact.asienco === 0 && fact.asienco > facturasUnicas[ind].asienco)   ){
      console.log('IF 1 : '+facturasUnicas[ind].asienco + " POR " + fact.asienco)
      facturasUnicas[ind] = fact
    }
    else if( facturasUnicas[ind].asienco === 0 && fact.CONCEPTO !== facturasUnicas[ind].CONCEPTO  ){

      facturasUnicas.push(fact)
            console.log('IF 2 ASIENCO: ' + fact.asienco +"  CONCEPTO: "+ fact.CONCEPTO)

    }
     else if( (fact.asienco === 0 &&  facturasUnicas[ind].CONCEPTO !== fact.CONCEPTO) && facturasUnicas[ind].asienco !== 0 ){
            console.log('IF 3')

      facturasUnicas[ind] = fact
    }
    else if( (fact.asienco !== 0 && facturasUnicas[ind].asienco ===0) && (fact.CONCEPTO !== facturasUnicas[ind].CONCEPTO) ){
       
      console.log('IF 4')
      facturasUnicas.push(fact)
    }
    else if((fact.asienco !== 0 && facturasUnicas[ind].asienco ===0) && (fact.CONCEPTO === facturasUnicas[ind].CONCEPTO)){
      console.log('IF 5')
     facturasUnicas[ind] = fact
    }
    else if(fact.asienco !== 0 && fact.CONCEPTO !== facturasUnicas[ind].CONCEPTO){
      facturasUnicas.push(fact)
      console.log('IF 6')
    }else{

      console.log('PRIMER ELSE')
    }

  }else{
    console.log(' ultimo esle ' + fact.CONCEPTO)
    facturasUnicas.push(fact)

  }
})

console.log(facturasUnicas.length)

  res.json({facturas:facturasUnicas})
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


app.post('/obtenertarifa', async(req,res)=>{

  let TARIFA_URL='https://api.calculator.guestready.com/api/v1/leads/estimate'
  let { address, coordinates, number_of_bedrooms, context,original_source, calculator_path } = req.body

 let data =  { address, coordinates, number_of_bedrooms, context,original_source, calculator_path }


 let respuesta=  await axios.post(TARIFA_URL, data)
 let tarifa = respuesta.data 

 if(tarifa){
   res.status(200).json({ok:true,p:tarifa})
 }else{
  res.status(500).json({ok:false, msg:'Ha ocurrido un error en el servidor'})
 }




  // let ciudad = req.body.ciudad
  // let habitaciones = req.body.habitaciones
  
  // let tarifas = await getDataScrapping(ciudad,habitaciones);

  // if(tarifas.ok){
  //   if(tarifas.precio.p.length <3){
  //     res.status(400).json({
  //       ok:false,
  //       msg:'Vuelva a intentarlo'
  //     })
  //   }else{

  //     res.status(200).json(tarifas)
  //   }
  // }else{
  //   res.status(400).json(tarifas)
  // }
})

app.listen(2727, () => {
    console.log('servidor en el puerto 2727')
})