/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express    = require('express'),
  app          = express(),
  bluemix      = require('./config/bluemix'),
  extend       = require('util')._extend,
  NLClassifier = require('./natural-language-classifier'),
  _ = require('underscore'),
  Promise = require('bluebird'),
  memes = require('./memes.json'),
  normalizeQuestion = require('./normalize-question.js'),
  debug = require('debug')('george');

// Bootstrap application settings
require('./config/express')(app);

// if bluemix credentials exists, then override local
var credentials = extend({
  url : '<url>',
  username : '<username>',
  password : '<password>',
  classifier_id: process.env.CLASSIFIER_ID // pre-trained classifier
}, bluemix.getServiceCreds('natural_language_classifier')); // VCAP_SERVICES


// Create the service wrapper
var nlClassifier = new NLClassifier(credentials);

var classify = Promise.promisify(nlClassifier.classify, nlClassifier);

var DEFAULT_CATEGORY = "I DON'T CARE/WHAT DO YOU MEAN";
var MINIMAL_CONFIDENCE = 0.6;

app.post('/', function(req, res, next) {
  var question = req.body.text;
  var seen = req.body.seen;
  var normalizedQuestion = normalizeQuestion(question);
  debug('Normalized question: ' + normalizedQuestion);
  classify({ text: normalizedQuestion })
    .spread(function (results) {
      results.question = question;
      var confidence = results.classes[0].confidence;
      var category = results.top_class;

      debug('Classifier result: "' + category + '" with confidence ' + confidence);

      results.confidence = confidence;

      if (confidence < MINIMAL_CONFIDENCE) {
        debug('Confidence is less than ' + MINIMAL_CONFIDENCE +
              ': falling back to "' + DEFAULT_CATEGORY + '"');
        category = DEFAULT_CATEGORY;
      }
      results.category = category;

      var categoryMemes = memes[category];
      var unseenMemes = _.reject(categoryMemes, function(meme) {
        var wasSeen = _.contains(seen, meme.image);
        if (wasSeen) {
          debug('Avoiding image ' + meme.image + ' already seen.');
        }
        return wasSeen;
      });
      var candidateMemes = unseenMemes;
      if (!candidateMemes.length) {
        debug('No unseen images! Falling back.');
        candidateMemes = categoryMemes;
      }
      var meme = _.sample(candidateMemes);

      if (meme) {
        results.meme_url = meme.link;
        results.image_url = meme.image;
      }

      res.json(results);
    })
    .catch(next);
});

// error handler
app.use(function(err, req, res, next) {
  var error = {
    code: err.status || 500,
    error: err.message || err.error
  };
  console.log('error:', err.stack || error.error);

  res.status(error.code).json(error);
});

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);
