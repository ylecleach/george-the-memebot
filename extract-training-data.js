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

var
  Promise = require('bluebird'),
  request = Promise.promisify(require('request')),
  fs = Promise.promisifyAll(require('fs')),
  csv = Promise.promisifyAll(require('csv')),
  normalizeQuestion = require('./normalize-question.js');

var csvData = fs.readFileAsync("data.csv", "utf-8");

var memes = {}, corpus = [];
csvData.then(function (csvData) {
    return csv.parseAsync(csvData, {columns:true});
  })
  .map(function (row) {
    if (!row.category) return;
    if (row.memeUrl) {
      var imageUrl = row.imageUrl;
      if (!imageUrl && row.memeUrl.match(/http:\/\/memegenerator.net\/instance\/([0-9]+)/)){
        imageUrl = 'http://cdn.meme.am/instances/500x/' + RegExp.$1 + '.jpg';
      }
      if (imageUrl) {
        var urls = memes[row.category] = (memes[row.category] || []);
        urls.push({ image: imageUrl, link: row.memeUrl });
      }
    }
    if (row.question) {
      corpus.push({text:normalizeQuestion(row.question), classes:[row.category]});
    }
    return row;
  })
  .then(function () {
      return [
        fs.writeFileAsync('memes.json', JSON.stringify(memes, null, 2)),
        fs.writeFileAsync('corpus.json', JSON.stringify({
          language: 'en',
          training_data: corpus
        }, null, 2))
      ];
  }).all();
