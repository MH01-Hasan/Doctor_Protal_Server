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

        //all get api 
        app.get('/appointmentOptions', async (req, res) => {
            const query = {}
            const option = await appormentCollection.find(query).toArray()
            res.send(option)
        })


        // Booking data Post/
        app.post('/bookings', async (req, res) => {
            const booking = req.body
            const result = await BookingsCollection.insertOne(booking);
            res.send(result)

        })

    }

    finally {

    }

}

run().catch(console.log)





app.listen(port, () => console.log(`Docotot portal running ${port}`))