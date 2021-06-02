const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');
const multer = require('multer');
const fs = require('fs')
const path=require('path')

const Books = require('../models/books');

const bookRouter = express.Router();

bookRouter.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

const imageFileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('You can upload only image files!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: imageFileFilter
});

bookRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, (req, res, next) => {
        Books.find({})
            .populate('user')
            .then((books) => {
                console.log(req.header);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(books);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, upload.single('image'), (req, res, next) => {
        console.log(JSON.parse(req.body.document).description)
        var obj = JSON.parse(req.body.document)
        console.log(req.body.document)
        Books.create({
                description: obj.description,
                year: obj.year,
                branch: obj.branch,
                price: obj.price,
                number: obj.number,
                college: obj.college
            })
            .then((book) => {
                console.log(book)
                book.image = 'images/' + req.file.originalname;
                book.user = req.user._id;
                book.save()
                    .then((b) => {
                        console.log('Book Created ', b);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.redirect('/books/mybooks')
                    }, (err) => next(err))
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /Books');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Books.deleteMany({
                user: req.user._id
            })
            .then((result) => {
                Books.find({
                        user: req.user._id
                    })
                    .populate('user')
                    .then((books) => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(books);
                    }, (err) => next(err));
            }, (err) => next(err));
    });

bookRouter.route('/mybooks')
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Books.find({
                user: req.user._id
            })
            .populate('user')
            .then((book) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(book);
            }, (err) => next(err))
            .catch((err) => next(err));
    })

bookRouter.route('/mybooks/:dishId')
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        console.log(req.body);
        Books.findOne({
                _id: req.params.dishId
            })
            .populate('user')
            .then((book) => {
                if (book.user._id.toString() === req.user.id.toString()) {
                    console.log()
                    const imagePath = path.join(__dirname , '..', 'public', book.image)

                    fs.unlink(imagePath, (err) => {
                            if (err) {
                                console.error(err)
                                return
                            }
                            //file removed
                        })
                    book.remove()
                    
                    // const fs = require('fs')

                    
                        .then((result) => {
                            Books.find({
                                    user: req.user._id
                                })
                                .populate('user')
                                .then((books) => {
                                    res.statusCode = 200;
                                    res.setHeader("Content-Type", "application/json");
                                    res.json(books);
                                }, (err) => next(err));
                        }, (err) => next(err));
                } else {
                    var err = new Error('You do not have any books');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

module.exports = bookRouter;