const puppeteer = require('puppeteer');
const fs = require('fs');

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

async function obtenerDatosAngular() {
  const navegador = await puppeteer.launch({ headless: false, slowMo: 500 });
  const pagina = await navegador.newPage();
  await pagina.goto('https://blog.angular.dev/', { waitUntil: 'networkidle2' });

  
  await autoScroll(pagina);

  
  const datos = await pagina.evaluate(() => {
    const results = [];

    document.querySelectorAll('article').forEach(art => {
      const titulo = art.querySelector('h2')?.innerText.trim() || '';
      const descripcion = art.querySelector('h3')?.innerText.trim() || '';
      const autor = art.querySelector('div.dd > a > p')?.innerText.trim() || '';
      const avatar = art.querySelector('div.dd img')?.src || '';
      const fecha = art.querySelector('span')?.innerText.trim() || '';

      let likes = null;
      let comentarios = null;

      const spans = Array.from(art.querySelectorAll('div.dd span'))
        .map(s => s.innerText.trim())
        .filter(Boolean);

      spans.forEach(texto => {
        const lower = texto.toLowerCase();
        const num = parseFloat(texto.replace(/[^\d.]/g, ''));
        if (lower.includes('like') && !isNaN(num)) likes = num;
        if (lower.includes('comment') && !isNaN(num)) comentarios = num;
      });

      const posiblesNumeros = spans.map(t => parseFloat(t)).filter(n => !isNaN(n));
      if (likes === null && posiblesNumeros.length > 0) likes = posiblesNumeros[0];
      if (comentarios === null && posiblesNumeros.length > 1) comentarios = posiblesNumeros[1];

      results.push({
        titulo,
        descripcion,
        autor,
        avatar,
        fecha,
        reacciones: {
          likes: likes || 0,
          comentarios: comentarios || 0
        }
      });
    });

    return results;
  });


  fs.writeFileSync('angular_blog.json', JSON.stringify(datos, null, 2), 'utf-8');
  console.log(`Se extrajeron ${datos.length} artículos.`);
  console.log('Archivo guardado como angular_blog.json');

  await navegador.close();
}

obtenerDatosAngular();


