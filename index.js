const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000
require('dotenv').config()


const app = express()


//middelware//
app.use(cors());
app.use(express.json())



//Connect with mongo bd//
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bs9pl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

//dota Collection with mongo

async function run() {
    try {
        // all Colection Here//
        const appormentCollection = client.db("DoctorProtal").collection('appointmentOptions');
        const BookingsCollection = client.db("DoctorProtal").collection('bookings');
        const UsersCollection = client.db("DoctorProtal").collection('users');

        //all get api 
        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date;
            const query = {}
            const option = await appormentCollection.find(query).toArray()
            //............................Booking Slot Daynamic Dispaly Show.............................././
            const bookingQuery = { appointmentdate: date }
            const allredyBooked = await BookingsCollection.find(bookingQuery).toArray()
            option.forEach(option => {
                const optionBooked = allredyBooked?.filter(book => book?.treatmentName === option?.name)
                const bookedslot = optionBooked?.map(slotbook => slotbook?.slot)
                const remeiningSolt = option?.slots.filter(slot => !bookedslot.includes(slot))
                option.slots = remeiningSolt

            })
            res.send(option)
        })

        // Booking data get //
        app.get('/bookings', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const bookings = await BookingsCollection.find(query).toArray()
            res.send(bookings)

        })

        // Booking data Post/
        app.post('/bookings', async (req, res) => {
            const booking = req.body
            const query = {
                appointmentdate: booking?.appointmentdate,
                email: booking?.email,
                treatmentName: booking?.treatmentName
            }
            const alreadybooked = await BookingsCollection.find(query).toArray()
            if (alreadybooked.length) {
                const massege = `You already have a booking on  ${booking.appointmentdate}`
                return res.send({ acknowledged: false, massege })

            }
            const result = await BookingsCollection.insertOne(booking);
            res.send(result)

        })
        //Users Data Post//
        app.post('/users', async (req, res) => {
            const user = req.body
            const result = await UsersCollection.insertOne(user)
            res.send(result)
        })

    }

    finally {

    }

}

run().catch(console.log)





app.listen(port, () => console.log(`Docotot portal running ${port}`))