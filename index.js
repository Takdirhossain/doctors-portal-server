const express = require('express');
const PORT = process.env.PORT || 5000
const cors = require("cors")
const app = express()

app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://doctor-portal:CeWZIq00sfJdeK5V@cluster0.eurlfla.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const appoinmentOptions = client.db('doctors-portal').collection('appoinmentoption')
        const bookingscollections = client.db('doctors-portal').collection('bookingscollections')
        app.get('/appoinmentoption', async (req, res) => {
            const date = req.query.date
            console.log(date)
            const query = {}
            const option = await appoinmentOptions.find(query).toArray()
            const bookingquery = { appointmentDate: date }
            const alredyBooked = await bookingscollections.find(bookingquery).toArray()
            option.forEach(op => {
                const optionbooked = alredyBooked.filter(book => book.treatment === op.name)
                const bookslot = optionbooked.map(book => book.slot)
                const remainingslots = op.slots.filter(slot => !bookslot.includes(slot))
                op.slots = remainingslots
                
            })
            res.send(option)
        })
        app.post('/bookings', async (req, res) => {
            const id = req.body
            console.log(id)
            const query = {
                appointmentDate: id.appointmentDate,
                email: id.email,
                treatment: id.treatment
            }
            const alreadyBooked = await bookingscollections.find(query).toArray()
            if(alreadyBooked.length) {
                const message = `You already Booked This ${id.appointmentDate}`
                return res.send({acknowledge: false, message})
            }
            const result = await bookingscollections.insertOne(id)
            res.send(result)
        })

    }
    finally {

    }
}
run().catch(error => console.lor(error))

app.get('/', async (req, res) => {
    res.send("This is doctror portal server")
})

app.listen(PORT, () => {
    console.log(`The server is runing on ${PORT}`)
})