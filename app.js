const express = require('express');
const logger = require('morgan');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// serve static files from public-folder
app.use(express.static('public'));

module.exports = app;
