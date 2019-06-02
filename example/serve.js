const express = require('express')
const app = express()

app.use('/scripts', express.static(__dirname.replace('example','src')))
app.use('/', express.static(__dirname))

app.listen(4080)

console.log(`Listening at http://localhost:4080`)