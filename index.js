const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000
require('dotenv').config()

const ObjectId = require("mongodb").ObjectId;


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

function verifyJWt(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send('unauthorization')
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ massege: "For decoded acssess" })
        }
        req.decoded = decoded
        next()
    })

}

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
        app.get('/bookings', verifyJWt, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail)
            if (email !== decodedEmail) {
                return res.status(403).send({ massege: "forbidden no access" })
            }

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

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await UsersCollection.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: "1h" })
                return res.send({ accessTocken: token })
            }
            res.status(403).send({ accessTocken: "" })

        })

        app.get('/users', async (req, res) => {
            const query = {}
            const result = await UsersCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/users/admin/:email',async(req,res)=>{
            const email = req.params.email
            const query = { email: email }
            const user = await UsersCollection.findOne(query)
            res.send({isadmin: user?.role === "admin"})


        })

        //Users Data Post//
        app.post('/users', async (req, res) => {
            const user = req.body
            const result = await UsersCollection.insertOne(user)
            res.send(result)
        })


        // Make Admin///
        app.put('/updateuser/admin/:id', verifyJWt, async (req, res) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const user = await UsersCollection.findOne(query)

            if (user?.role !== "admin") {
                return res.status(403).send({ massege: "forbidden access" })
            }
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await UsersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });


        /// Delete user//
        // app.delete("/deleteuser/:id", async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) };
        //     const result = await UsersCollection.deleteOne(query);
        //     res.json(result);
        // });








    }

    finally {

    }

}

run().catch(console.log)





app.listen(port, () => console.log(`Docotot portal running ${port}`))