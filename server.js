const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Crear carpeta db si no existe
if (!fs.existsSync('./db')) {
  fs.mkdirSync('./db');
}

// Conectar a la base de datos
const db = new Database('./db/sensores.db');

// Crear tabla si no existe
db.prepare(`
  CREATE TABLE IF NOT EXISTS lecturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id INTEGER,
    humedad REAL,
    temp REAL,
    fecha TEXT
  )
`).run();

// Configurar EJS y archivos estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Página principal
app.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM lecturas ORDER BY id DESC LIMIT 100').all();
    res.render('index', { lecturas: rows });
  } catch (err) {
    console.error("❌ Error al cargar lecturas:", err.message);
    res.status(500).send("Error al consultar la base de datos.");
  }
});

// Exportar a CSV
app.get('/export', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM lecturas ORDER BY id').all();
    const csv = ['ID,Sensor,Humedad,Temperatura,Fecha/Hora'];
    rows.forEach(r => {
      csv.push(`${r.id},${r.sensor_id},${r.humedad},${r.temp},${r.fecha}`);
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('lecturas.csv');
    res.send(csv.join('\n'));
  } catch (err) {
    console.error("❌ Error al exportar CSV:", err.message);
    res.status(500).send("Error al exportar datos.");
  }
});

// API (lecturas recientes)
app.get('/api/lecturas', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM lecturas ORDER BY id DESC LIMIT 100').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener lecturas" });
  }
});

// Ruta POST desde ESP32
app.post('/api/sensores', (req, res) => {
  const { sensor_id, humedad, temp, timestamp: fecha } = req.body;

  if (!sensor_id || humedad == null || temp == null || !fecha) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const stmt = db.prepare('INSERT INTO lecturas (sensor_id, humedad, temp, fecha) VALUES (?, ?, ?, ?)');
    const result = stmt.run(sensor_id, humedad, temp, fecha);
    console.log(`✅ Lectura guardada con ID: ${result.lastInsertRowid}`);
    res.json({ message: "Datos guardados", id: result.lastInsertRowid });
  } catch (err) {
    console.error("❌ Error al guardar datos:", err.message);
    res.status(500).json({ error: "Error al guardar datos" });
  }
});

// Histórico con filtros
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

  try {
    const rows = db.prepare(query).all(...params);
    res.render('historico', {
      lecturas: rows,
      filtros: { fecha, sensor_id }
    });
  } catch (err) {
    console.error("❌ Error al cargar histórico:", err.message);
    res.status(500).send("Error al cargar el historial.");
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
