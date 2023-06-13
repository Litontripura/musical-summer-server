const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({error: true, message: "unauthorized access",});
  }

  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

// mongo db

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.smw9mp5.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const userCollection = client.db("creativeSummer").collection("users");
    const bannerCollection = client.db("creativeSummer").collection("bannerImg");
    const classesCollection = client.db("creativeSummer").collection("classes");
    const myAddClassCollection = client.db("creativeSummer").collection("myAddClass");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn:"5h"})
      res.send({token})
    });

    // saved users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = {email: user.email}
      const existingUser = await userCollection.findOne(query)
    
      if(existingUser){
        return res.send({message:'user already exists'})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // classes
    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    app.post('/classesadd', async(req, res)=>{
      console.log(req.body);
      const body = req.body;
      const result = await classesCollection.insertOne(body);
      res.send(result)
    })

    // get all add classes
    app.get('/myclass', async(req, res)=>{
      const email = req.query.email;
      if(!email){
        res.send([])
      }
    
      const query = {email: email}
      const result = await myAddClassCollection.find(query).toArray()
      res.send(result)
    }) 
    
    // instructor get class
    app.get('/instructorAddclass', async(req, res)=>{
      const email = req.query.email;
      if(!email){
        res.send([])
      }
    
      const query = {email: email}
      const result = await classesCollection.find(query).toArray()
      res.send(result)
    })
    // myAddClass
    app.post('/myaddclass', async(req,res)=>{
      const addClass = req.body;
      const result = await myAddClassCollection.insertOne(addClass)
      res.send(result)
    })
  

    // short classes rout

    app.get('/classShort', async(req, res)=>{
      const type = req.query.type == 'ascending'
      const valu = req.query.value;
      const result = await classesCollection.find({}).sort({enroled: -1}).toArray()
      res.send(result)
    })
    // short instructor route
    app.get('/instructor', async(req, res)=>{
     
      const result = await userCollection.find({ role: 'instructor' }).sort({ enroled: -1 }).toArray();
  res.send(result);
    })
    // admin 
    app.get('/user/admin/:email', async(req, res)=>{
        const email = req.params.email;
     
        const query = {email : email }
        const user = await userCollection.findOne(query)
        const result = {admin: user?.role === 'admin'}
        res.send(result)
    })

    app.get('/user/instructor/:email', async(req, res)=>{
        const email = req.params.email;
        
        const query = {email : email }
        const user = await userCollection.findOne(query)
        const result = {admin: user?.role === 'instructor'}
        res.send(result)
    })

    //  make admin an user
    app.patch('/users/admin/:id', async(req, res)=>{
       const id = req.params.id;
       const filter ={_id: new ObjectId(id)}
       const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })
    // populer classes
    // app.get("/popular-classes", async (req, res) => {
    //   const pipeline = [
    //     {
    //       $project: {
    //         class_name: 1,
    //         num_students: { $size: "$students" }
    //       }
    //     },
    //     {
    //       $sort: { num_students: -1 }
    //     },
    //     {
    //       $limit: 6
    //     }
    //   ];
    
    //   const result = await classesCollection.aggregate(pipeline).toArray();
    //   res.send(result);
    // });
    


    app.get("/banner", async (req, res) => {
      const result = await bannerCollection.find().toArray();
      res.send(result);
    });

    // make instractor
    app.patch('/users/instructor/:id', async(req, res)=>{
       const id = req.params.id;
       const filter ={_id: new ObjectId(id)}
       const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })
    // Delete a user
    app.delete('/deletuser/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result= await userCollection.deleteOne(query)
      res.send(result)
    })
    // delete my Add class
    app.delete('/myDeletclass/:id', async(req,res)=>{
      const id = req.params.id;
      console.log(id);
      const query = {_id : new ObjectId(id)}
      const result= await myAddClassCollection.deleteOne(query)
      res.send(result)
    })
    // banner section
    app.get("/banner", async (req, res) => {
      const result = await bannerCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("allah is powerfull");
});
app.listen(port, () => {
  console.log(`Port is running at ${port}`);
});
