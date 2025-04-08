async function cargarLecturas() {
    try {
      const res = await fetch('/api/lecturas');
      const data = await res.json();
  
      const cuerpoTabla = document.getElementById('tabla-lecturas');
      cuerpoTabla.innerHTML = '';
  
      data.forEach(l => {
        const fila = `
          <tr>
            <td>${l.id}</td>
            <td>${l.sensor_id}</td>
            <td>${l.humedad}</td>
            <td>${l.temp}</td>
            <td>${l.fecha}</td>
          </tr>`;
        cuerpoTabla.innerHTML += fila;
      });
  
    } catch (error) {
      console.error('⛔ Error actualizando tabla:', error);
    }
  }
  
  // Actualizar cada 5 segundos
  setInterval(cargarLecturas, 5000);