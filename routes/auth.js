const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
const assert = require('assert');
const { authorized, parseUser, anonymouse } = require('../middlewares/auth');

const router = express.Router();
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017'; // mongodb Connection URL
const dbName = 'heroku_342hvvg9'; // Database Name

const JWT_SECRET = 'relax take it easy';
const COOKIE_NAME = 'cookie-jwt-access-token';

function addUser(res, username, password, email) {
	MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
		assert.equal(null, err);
		const db = client.db(dbName);
		const collection = db.collection('users');

		collection.findOne({ email }, (err, user) => {
			if (err) {
				console.log('error in finding doc:', err);
				client.close();
				res.sendStatus(400);
			}
			if (user) { // user name exists
				return res.sendStatus(400);
			} // add new user to database
			const newUser = {
				username,
				password,
				email,
				joined: new Date().toISOString(),
			};
			collection.insertOne(newUser);

			// create a jwt token for the user
			const payload = { username: newUser.email, joined: newUser.joined };
			const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

			// set cookie for the client with the jwt
			res.cookie(COOKIE_NAME, accessToken, { httpOnly: true });
			return res.redirect('/');
		});
	});
}

function checkUserName(res, email, password) {
	MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
		assert.equal(null, err);
		const db = client.db(dbName);
		const collection = db.collection('users');
		// what to do with email ?
		collection.findOne({ email }, (err, user) => {
			if (err) {
				console.log('error in finding doc:', err);
				client.close();
				res.sendStatus(400);
			}
			if (user) {
				if (user.password === password) {
					// create a jwt token for the user
					const payload = { username: user.email, joined: user.joined };
					const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
					// set cookie for the client with the jwt
					res.cookie(COOKIE_NAME, accessToken, { httpOnly: true });

					client.close();
					res.redirect('/');
				} else { // wrong password
					client.close();
					res.sendStatus(400);
				}
			} else { // user not found
				client.close();
				res.sendStatus(400);
			}
		});
	});
}

router.post('/login', (req, res) => {
	if (!req.body) { // make sure request body exist
		return res.sendStatus(400);
	}
	const { email, password } = req.body;
	checkUserName(res, email, password);
});
router.post('/register', (req, res) => {
	// make sure request body exist
	if (!req.body) {
		return res.sendStatus(400);
	}
	const { username, password, email } = req.body;
	addUser(res, username, password, email);
});
router.get('/logout', authorized, (req, res) => {
	// remove the cookie to perform a logout

	res.clearCookie(COOKIE_NAME);
	res.redirect('/');
});

module.exports = router;
