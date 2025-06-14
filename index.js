require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mnwmrsu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run () {
    try {
    await client.connect();
    
    const jobsCollection = client.db("jobsDB").collection('jobsCollection');
    const applicationsCollection = client.db("jobsDB").collection("applicationCollection");

    app.get("/jobs", async(req, res) => {
      const hrEmail = req.query.email;
      let query = {};
      if(hrEmail) {
         query = {hr_email : hrEmail}
      }
      const result = await jobsCollection.find(query).toArray();
      res.send(result)
    })

    app.get("/jobs/applications", async(req, res) => {
      const email = req.query.email;
      const query = {hr_email : email};
      const jobs = await jobsCollection.find(query).toArray();

      for (const job of jobs) {
        const applicationQuery = {jobId : job._id.toString()};
        const applicationCount = await applicationsCollection.countDocuments(applicationQuery);
        job.application_count = applicationCount;
      }
      res.send(jobs);
    })
    app.get("/jobs/:id", async(req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await jobsCollection.findOne(query);
      res.send(result);
    })

    app.post("/jobs", async(req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      console.log(result);
      res.send(result)
    })

    // Application api

    app.get("/applications", async(req,res) => {
      const singleEmail = req.query.email;
      let query = {};
      if(singleEmail) {
        query = { email : singleEmail}
      }
      const result = await applicationsCollection.find(query).toArray();
      for(let application of result) {
        const jobId = application.jobId;
        const query = {_id : new ObjectId(jobId)};
        const job = await jobsCollection.findOne(query);
        application.company = job.company;
        application.title = job.title;
        application.logo = job.company_logo;
      }
      res.send(result); 
    })

    app.get("/applications/job/:job_id", async(req, res) => {
      const job_id = req.params.job_id;
      const query = { jobId : job_id }
      const result = await applicationsCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    })

    app.post("/applications", async(req, res) => {
      const doc = req.body;
      const result = await applicationsCollection.insertOne(doc);
      console.log(result);
      res.send(result);
    })

    app.patch("/applications/:id", async(req, res) => {
      const updated = req.body;
      const id = req.params.id;
      console.log(updated, id)
      const filter = {_id : new ObjectId(id)};
      const updatedDoc = {
        $set: {
          status : updated
        }
      } 

      const result = await applicationsCollection.updateOne(filter, updatedDoc);
      console.log(result);
      res.send(result);
    })

    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {

    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Job Portal server is running")
})

app.listen(port, () => {
    console.log(`Job portal server is running on port - ${port}`)
})