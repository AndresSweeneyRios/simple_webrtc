const express = require('express')
const app = express()

app.get('/', (req,res) => res.sendFile(__dirname + '/index.html'))
app.get('/script.js', (req,res) => res.sendFile(__dirname + '/script.js'))

app.use(express.static(__dirname.replace('test','')))

app.listen(4080)

console.log(`Listening at http://localhost:4080`)