const express = require('express');
const PORT = process.env.PORT || 5000
const cors = require("cors")
const jwt = require('jsonwebtoken')
const app = express()
require('dotenv').config();

app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://doctor-portal:CeWZIq00sfJdeK5V@cluster0.eurlfla.mongodb.net/?retryWrites=true&w=majority";
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyjwt(req, res, next) {
    const autheader = req.headers.authorization
    if (!autheader) {
        res.status(401).send("unauthorized access")
    }
    const token = autheader.split(' ')[1]
    jwt.verify(token, process.env.jwt, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded
        next()
    })
}
async function run() {
    try {
        const appoinmentOptions = client.db('doctors-portal').collection('appoinmentoption')
        const bookingscollections = client.db('doctors-portal').collection('bookingscollections')
        const usercollections = client.db('doctors-portal').collection('user')
        app.get('/appoinmentoption', async (req, res) => {
            const date = req.query.date

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

        app.get('/bookings', verifyjwt, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            const query = { email: email };
            const bookings = await bookingscollections.find(query).toArray();
            res.send(bookings);
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
            if (alreadyBooked.length) {
                const message = `You already Booked This ${id.appointmentDate}`
                return res.send({ acknowledge: false, message })
            }
            const result = await bookingscollections.insertOne(id)
            res.send(result)
        })
        app.get('/jwt', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const result = await usercollections.findOne(query)
            if (result) {
                const token = jwt.sign({ email }, process.env.jwt, { expiresIn: '1h' })
                return res.send({ accessToken: token })
            }
            console.log(result)
            res.status(403).send({ accessToken: '' })
        })

        app.get('/users', async (req, res) => {
            const query = {}
            const user = await usercollections.find(query).toArray()
            res.send(user)
        } )
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usercollections.insertOne(user);
            res.send(result);
        });

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