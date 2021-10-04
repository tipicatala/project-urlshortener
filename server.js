require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require("body-parser");
const shortId = require("shortid");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

const uri = process.env.MONGO_URI
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})

const connection = mongoose.connection
connection.on('error', err => console.error(err))

const Schema = mongoose.Schema
const urlSchema = new Schema({
  original_url: String,
  short_url: String,
})

const URLDB = mongoose.model('URLDB', urlSchema)
const urlValidator = new RegExp('^https*:\/\/.*')

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', async function(req, res) {
    let urlValid = urlValidator.test(req.body.url)
    
  if(!urlValid) {
    res.json({
      error: 'invalid url',
    })
  } else {
    try {
      let findOne = await URLDB.findOne({
          original_url: req.body.url,
        })

      if (findOne) {
        res.json({
          original_url : findOne.original_url,
          short_url : findOne.short_url,
        })
      } else {
          findOne = new URLDB({
            original_url : req.body.url,
            short_url : shortId.generate()
          })
          await findOne.save()
          res.json({
            original_url : findOne.original_url,
            short_url : findOne.short_url,
          })
      }
    } catch(err) {
      console.error(err)
    }
  }
});

app.get('/api/shorturl/:id', async function(req, res) {
  try {
    const findOne = await URLDB.findOne({
      short_url: req.params.id,
    })

    const myUrl = new URL(findOne.original_url)

    if (findOne) {
      res.redirect(myUrl)
    } else {
      res.json({ error: 'invalid url' })
    }
  } catch(err) {
    console.error(err)
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});