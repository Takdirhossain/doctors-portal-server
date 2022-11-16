const express = require('express');
const PORT = process.env.PORT || 5000
const cors = require("cors")
const app = express()

app.use(cors())
app.use(express.json())

app.get('/', async(req, res) => {
    res.send("This is doctror portal server")
})

app.listen(PORT, () => {
    console.log(`The server is runing on ${PORT}`)
})