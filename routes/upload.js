const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const path = require('path');
const mongodb = require('mongodb');

const { ObjectID } = mongodb;
const { MongoClient } = require('mongodb');
const assert = require('assert');
const fs = require('fs');

const routerUpload = express.Router();
const dbName = 'heroku_342hvvg9'; // Database Name
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017'; // mongodb Connection URL
const dataurl = `${url}/heroku_342hvvg9`;
// create or use an existing mongodb-native db instance.
// for this example we'll just create one:

// make sure the db instance is open before passing into `Grid`

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
	assert.equal(null, err);
	const db = client.db(dbName);
	const bucket = new mongodb.GridFSBucket(db, {
		bucketName: 'imgRent',
	});

	const storage = new GridFsStorage({
		url: dataurl, // mongodb Connection URL
		file: (req, file) => new Promise((resolve, reject) => {
			crypto.randomBytes(16, (err, buf) => {
				if (err) {
					return reject(err);
				}
				const filename = buf.toString('hex') + path.extname(file.originalname);
				// check type of upload if rent or sale
				const fileInfo = {
					filename,
					bucketName: 'imgRent',
				};
				resolve(fileInfo);
			});
		}),
	});
	const upload = multer({ storage });

	routerUpload.post('/upload-sale', upload.single('img'), (req, res) => {
		const collection = db.collection('carSale');

		const {
			milege, engineType, gearBox, carColor, roadEntry, price, carModel, airBags, seats,
		} = req.body;
		const { username } = req.user;
		const data = {
			username,
			milege,
			engineType,
			gearBox,
			carColor,
			roadEntry,
			price,
			carModel,
			airBags,
			seats,
			filename: req.file.filename,

		};
		collection.insertOne(data);
		res.sendStatus(200);
	});
	routerUpload.post('/upload-rent', upload.single('img'), (req, res) => {
		const collection = db.collection('carRent');
		const {
			engineType,
			gearBox,
			carColor,
			roadEntry,
			priceDay,
			toDate,
			fromDate,
			carModel,
			airBags,
			seats,
		} = req.body;
		const { username } = req.user;
		const data = {
			username,
			priceDay,
			engineType,
			gearBox,
			carColor,
			roadEntry,
			toDate,
			fromDate,
			carModel,
			airBags,
			seats,
			filename: req.file.filename,
		};
		collection.insertOne(data);
		res.sendStatus(200);
	});
	routerUpload.post('/show-buy', (req, res) => {
		// add file name in get request
		const { carType } = req.body;

		const collection = db.collection('carSale');
		if (carType.length > 0) {
			collection.find({ carModel: carType }).toArray((err, docs) => {
				assert.equal(err, null);

				const array = [];
				const imageNmae = [];
				docs.forEach((element) => {
					array.push(element);
					imageNmae.push(element.filename);
				});
				imageNmae.forEach((fileName) => {
					bucket.openDownloadStreamByName(fileName).pipe(
						fs.createWriteStream(`./client/public/img/${fileName}`),
					).on('error',
						(error) => {
							console.log('Error:-', error);
							res.sendStatus(404);
						}).on('finish', () => {
						console.log(`${fileName} download complete!`);
					});
				});

				res.status(200).send(array);
			});
		} else {
			collection.find({}).toArray((err, docs) => {
				assert.equal(err, null);

				const array = [];
				const imageNmae = [];
				docs.forEach((element) => {
					array.push(element);
					imageNmae.push(element.filename);
				});
				imageNmae.forEach((fileName) => {
					bucket.openDownloadStreamByName(fileName).pipe(
						fs.createWriteStream(`./client/public/img/${fileName}`),
					).on('error',
						(error) => {
							console.log('Error:-', error);
						}).on('finish', () => {
						console.log(`${fileName} download complete!`);
					});
				});
				res.status(200).send(array);
			});
		}
	});
	routerUpload.post('/show-rent', (req, res) => {
		// add file name in get request
		// add search via date and price
		const { toDate, fromDate } = req.body;

		const collection = db.collection('carRale');
		if (carType.length > 0) {
			collection.find({ }).toArray((err, docs) => {
				assert.equal(err, null);

				const array = [];
				const imageNmae = [];
				docs.forEach((element) => {
					array.push(element);
					imageNmae.push(element.filename);
				});
				imageNmae.forEach((fileName) => {
					bucket.openDownloadStreamByName(fileName).pipe(
						fs.createWriteStream(`./client/public/img/${fileName}`),
					).on('error',
						(error) => {
							console.log('Error:-', error);
							res.sendStatus(404);
						}).on('finish', () => {
						console.log(`${fileName} download complete!`);
					});
				});

				res.status(200).send(array);
			});
		} else {
			collection.find({}).toArray((err, docs) => {
				assert.equal(err, null);

				const array = [];
				const imageNmae = [];
				docs.forEach((element) => {
					array.push(element);
					imageNmae.push(element.filename);
				});
				imageNmae.forEach((fileName) => {
					bucket.openDownloadStreamByName(fileName).pipe(
						fs.createWriteStream(`./client/public/img/${fileName}`),
					).on('error',
						(error) => {
							console.log('Error:-', error);
						}).on('finish', () => {
						console.log(`${fileName} download complete!`);
					});
					res.send(array);
				});
			});
		}
	});
});
module.exports = routerUpload;
