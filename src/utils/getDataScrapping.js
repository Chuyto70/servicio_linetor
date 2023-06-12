


async function getDataScrapping (ciudad = 'Holanda', camas = '4'){
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'], });
    try {
          

    const page = await browser.newPage()

    await page.goto("https://www.guestready.com/get-a-quote/", {
    waitUntil: "domcontentloaded",
     });
     await page.waitForSelector('.pac-target-input')
     await page.waitForSelector('.get-estimate-widget__submit')
    
     await page.type('.pac-target-input', ciudad)
     await page.waitForSelector('.pac-item')
     await page.click('.pac-item')
     await page.select('.get-estimate-widget__bedrooms',camas)

     await page.evaluate(()=>{
        let form = document.querySelector('.get-estimate-widget__form')
        setTimeout(()=>{
            
           let lat = form['lat'].value
           let lon = form['lon'].value
           let lugar = form['address'].value
           let cuartos = form['bedrooms'].value
          
           window.location.href = `https://calculator.guestready.com/result?address=${lugar}&lat=${lat}lat&lon=${lon}&bedrooms=${cuartos}`
           
        },500)
        
     })
     await page.waitForNavigation()
     await page.waitForSelector('.css-1gix2jd')
     
    let precio = await page.evaluate(()=>{
        let p = document.querySelector('.css-1gix2jd').textContent
        let porcentaje = document.querySelector('.css-1h2hll3').textContent
     
        return {
            p, porcentaje
        }
     })
    await browser.close();
    return {
        ok:true,
        precio
    }
    } catch (error) {
        await browser.close();
        return {
            ok:false,
            msg:'Error en el scrapping',
            error
        }
    }
 
}

module.exports = {
    getDataScrapping
}