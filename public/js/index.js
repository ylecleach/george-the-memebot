/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
/* global _ */

$(document).ready(function() {
  'use strict';

  // jQuery variables attached to DOM elements
  var $error = $('.error'),
    $errorMsg = $('.errorMsg'),
    $results = $('.results'),
    $question = $('.questionText');


  $('.ask-btn').click(function() {
    askQuestion($question.val());
    $question.focus();
  });

  $('.questionText').keyup(function(event){
    if(event.keyCode === 13) {
      askQuestion($question.val());
    }
  });

  var template = _.template($('script.template').html());

  var seen = [];

  // Ask a question via POST to /
  var askQuestion = function(question){
    if(!question) return;

    $(document.body).addClass('loading');
    $error.hide();

    $.post('/', {text: question, seen: seen})
      .done(function (answers){
        $results.prepend(template(answers));
        seen.push(answers.image_url);
      })
      .fail(function onError(error) {
        $error.show();
        $errorMsg.text(error.responseJSON.error ||
                       'There was a problem with the request, please try again');
      })
      .always(function always(){
        $question.val('');
        $(document.body).removeClass('loading');
      });
  };

});
