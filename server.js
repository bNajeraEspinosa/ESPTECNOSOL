const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Conectar a SQLite y crear archivo si no existe
const dbPath = './db/sensores.db';
if (!fs.existsSync('./db')) {
  fs.mkdirSync('./db');
}
const db = new sqlite3.Database(dbPath);

// Verificar o crear tabla 'lecturas'
db.run(`
  CREATE TABLE IF NOT EXISTS lecturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id INTEGER,
    humedad REAL,
    temp REAL,
    fecha TEXT
  )
`, (err) => {
  if (err) {
    console.error("Error al crear/verificar tabla:", err.message);
  } else {
    console.log("Tabla 'lecturas' verificada");
  }
});

// Configurar EJS y archivos estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Página principal (tabla de lecturas)
app.get('/', (req, res) => {
  db.all('SELECT * FROM lecturas ORDER BY id DESC LIMIT 100', [], (err, rows) => {
    if (err) {
      console.error(" Error al consultar lecturas:", err.message);
      return res.status(500).send("Error al consultar la base de datos.");
    }
    res.render('index', { lecturas: rows });
  });
});

// Ruta para exportar lecturas a CSV
app.get('/export', (req, res) => {
  db.all('SELECT * FROM lecturas ORDER BY id', [], (err, rows) => {
    if (err) {
      console.error(" Error al exportar CSV:", err.message);
      return res.status(500).send("Error al exportar datos.");
    }

    const csv = ['ID,Sensor,Humedad,Temperatura,Fecha/Hora'];
    rows.forEach(r => {
      csv.push(`${r.id},${r.sensor_id},${r.humedad},${r.temp},${r.fecha}`);
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('lecturas.csv');
    res.send(csv.join('\n'));
  });
});

// API para autorefrescar tabla con JS
app.get('/api/lecturas', (req, res) => {
  db.all('SELECT * FROM lecturas ORDER BY id DESC LIMIT 100', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener lecturas" });
    }
    res.json(rows);
  });
});

// Ruta POST desde ESP32
app.post('/api/sensores', (req, res) => {
  const { sensor_id, humedad, temp, timestamp: fecha } = req.body;

  if (!sensor_id || humedad == null || temp == null || !fecha) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const query = `INSERT INTO lecturas (sensor_id, humedad, temp, fecha) VALUES (?, ?, ?, ?)`;
  db.run(query, [sensor_id, humedad, temp, fecha], function (err) {
    if (err) {
      console.error(" Error al guardar datos:", err.message);
      return res.status(500).json({ error: "Error al guardar datos" });
    }

    console.log(`Lectura guardada con ID: ${this.lastID}`);
    res.json({ message: "Datos guardados", id: this.lastID });
  });
});

//busqueda por histórico
app.get('/historico', (req, res) => {
  const { fecha, sensor_id } = req.query;

  let query = 'SELECT * FROM lecturas WHERE 1=1';
  const params = [];

  if (fecha) {
    query += ' AND DATE(fecha) = DATE(?)';
    params.push(fecha);
  }

  if (sensor_id) {
    query += ' AND sensor_id = ?';
    params.push(sensor_id);
  }

  query += ' ORDER BY fecha DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(" Error al consultar historial:", err.message);
      return res.status(500).send("Error al cargar el historial.");
    }

    res.render('historico', {
      lecturas: rows,
      filtros: { fecha, sensor_id }
    });
  });
});


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
