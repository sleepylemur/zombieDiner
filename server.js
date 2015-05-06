var express = require('express');
var bodyParser = require('body-parser');
var sqlite3 = require("sqlite3").verbose();
var cors = require('cors');

var port = process.argv.length < 3 ? 3000 : process.argv[2];
var dbpath = process.argv.length < 4 ? "db/diner.db" : process.argv[3];
var db = new sqlite3.Database(dbpath);

var app = express();

app.use(cors());
app.use(bodyParser.json({ extended: false }));

app.use(express.static('public'));
app.get('/', function(req, res){
	res.render('index.html')
});

app.get('/categories', function(req, res){
	// console.log('getall');
	db.all("SELECT * FROM categories ORDER BY position", function(err, rows){
		if(err){
			throw err;
		}
		res.json(rows);
	});
});

app.get('/categories/:id', function(req, res){
	// console.log('get'+req.params.id);
	db.get('SELECT * FROM categories WHERE id = ?', req.params.id, function(err, row){
		if(err){
			throw err;
		}
		res.json(row);
	});
});

app.post('/categories', function(req, res){
	// console.log('post');
	// console.log(req.body);
	db.run("INSERT INTO categories (name,position) SELECT ?,COALESCE(max(position)+1,1) FROM categories", req.body.name, function(err,row){
		if(err){
			throw err;
		}
		var id = this.lastID;
        db.get("SELECT * FROM categories WHERE id = ?", id, function(err, row) {
        	if(err) {
        		throw err;
        	}
        	res.json(row);
        });
    });
});

app.put('/categories/:id', function(req, res){
	// console.log('put' + req.params.id);
	// console.log(req.body);
	var id = req.params.id
	db.run("UPDATE categories SET name = ?, position = ? WHERE id = ?", req.body.name, req.body.position, id, function(err){
		if(err){
			throw err;
		}
		db.get("SELECT * FROM categories WHERE id = ?", id, function(err, row){
			if(err){
				throw err;
			}
			res.json(row);
		});
	});
});

app.delete('/categories/:id', function(req, res){
	db.run("DELETE FROM categories WHERE id = ?", req.params.id, function(err){
		if(err){
			throw err;
		}
		res.json({deleted: true});
	});
});


app.get('/dishes', function(req, res) {
	db.all("SELECT * FROM dishes ORDER BY position", function(err, rows) {
		if(err) {
			throw err;
		}
		res.json(rows);
	});
});

app.get('/categories/:id/dishes', function(req, res) {
	db.all("SELECT * FROM dishes WHERE category_id = ? ORDER BY position", req.params.id, function(err, rows) {
		if (err) {
			throw err;
		}
		res.json(rows);
	});
});


app.get('/dishes/:id', function(req, res) {
	db.get("SELECT * FROM dishes WHERE id = ?", req.params.id, function(err, row){
		if(err) {
			throw err;
		}
		res.json(row);
	});
});

app.post('/dishes', function(req, res) {
	db.run("INSERT INTO dishes (name, price, image_url, category_id, position) SELECT ?,?,?,?,COALESCE(min(position)-1,0) FROM dishes WHERE category_id = ?", req.body.name, req.body.price, req.body.image_url, req.body.category_id, req.body.category_id, function(err) {
		if(err) {
			throw err;
		}
    var id = this.lastID;
    db.get("SELECT * FROM dishes WHERE id = ?", id, function(err, row) {
    	if(err) {
    		throw err;
    	}
    	res.json(row);
    });
  });
});

app.put('/dishes/:id', function(req, res) {
	var id = req.params.id;
	db.run("UPDATE dishes SET name = ?, image_url = ?, price = ?, category_id = ?, position = ? WHERE id = ?", req.body.name, req.body.image_url, req.body.price, req.body.category_id, req.body.position, id, function (err) {
		if(err) {
			throw err;
		}
		db.get("SELECT * FROM dishes WHERE id = ?", id, function(err, row) {
			if(err) {
				throw err;
			}
			res.json(row);
		});
	});
});

app.delete('/dishes/:id', function(req, res) {
	db.run("DELETE FROM dishes WHERE id = ?", req.params.id, function(err) {
		if(err) {
			throw err;
		}
		res.json({deleted: true});
	});
});

app.listen(port);
console.log('Listening on port '+port);
