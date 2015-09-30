
/*
 The MIT License (MIT)

 Copyright (c) 2015 outaTiME

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

'use strict';

/*global CodeMirror*/
/*eslint-disable no-console*/

// browserify

var Applause = require('applause');

// defaults

// TODO: took from file
var defaultOptions = [
  '{',
  '  "patterns": [',
  '    {',
  '      "match": /(\\w+)\\s(\\w+)/,',
  '      "replacement": "$2, $1"',
  '    }',
  '  ]',
  '}'
].join('\n');

var defaultText = 'John Smith';

// editors

var optionsEditor;
var textEditor;
var substitutionEditor;

// TODO: block UI on async methods

var _applause;

var replace = function() {
  var start = Date.now();
  var sourceValue = textEditor.getValue();
  var result = _applause.replace(sourceValue);
  var replaceTime = Date.now() - start;
  var doc = textEditor.getDoc();
  // clear all marks
  var marks = doc.getAllMarks();
  marks.forEach(function(mark) {
    mark.clear();
  });
  var count = result.count;
  if (count > 0) {
    (result.matches || []).forEach(function(match) {
      var re = match.re;
      var arr;
      while ((arr = re.exec(sourceValue)) !== null) {
        // highlight
        var from = doc.posFromIndex(arr.index);
        var to = doc.posFromIndex(arr.index + arr[0].length);
        // console.log('Mark text', from, to);
        doc.markText(from, to, {
          className: 'match-background'
        });
        // console.log('Match detail', matchDetail);
        if (!re.global) { // or it will become infinite.
          break;
        }
      }
    });
  }
  // update view
  var matchesDom = $('.options .results').removeClass('hidden');
  var replaceDetail = 'No matches';
  if (count === 1) {
    replaceDetail = '1 match'
  } else if (count > 1) {
    replaceDetail = count + ' matches'
  }
  if (replaceTime > 0) {
    replaceDetail += ' (' + replaceTime + ' ms)';
  }
  matchesDom.text(replaceDetail);
  // update result
  substitutionEditor.setValue(result.content);
};

var create = function() {
  var optionsValue = eval('(' + optionsEditor.getValue() + ')');
  // console.log('Create applause instance with:', optionsValue);
  // create new applause instance
  _applause = Applause.create($.extend({}, optionsValue, {
    // pass
  }));
  replace();
};

$(function() {
  // console.log('jQuery:', jQuery.fn.jquery);
  // console.log('Applause:', Applause.version);
  // console.log('CodeMirror:', CodeMirror.version);
  // update version number
  $('header span').text('v.' + Applause.version);
  // options
  var optionsTextArea = document.querySelector('div.options .editor');
  var spec = {
    name: 'javascript',
    json: true
  };
  optionsEditor = CodeMirror(optionsTextArea, {
    value: defaultOptions,
    lineNumbers: true,
    mode: spec,
    // viewportMargin: Infinity
    autofocus: true,
    styleSelectedText: true,
    lineWrapping: true,

    autoCloseBrackets: true,
    matchBrackets: true

  });
  // optionsEditor.setOption('mode', spec);
  // CodeMirror.autoLoadMode(optionsEditor, spec);
  optionsEditor.on('change', function(codeMirror, change) {
    // create new applause
    create();
    // indent on paste
    if (change.origin !== 'paste') {
      return;
    }
    var lineFrom = change.from.line;
    var lineTo = change.from.line + change.text.length;
    function reindentLines(codeMirror, lineFrom, lineTo) {
      codeMirror.operation(function() {
        codeMirror.eachLine(lineFrom, lineTo, function(lineHandle) {
          codeMirror.indentLine(lineHandle.lineNo(), 'smart');
        });
      });
    }
    reindentLines(codeMirror, lineFrom, lineTo);
  });
  // text
  var textTextArea = document.querySelector('div.text .editor');
  textEditor = window._textEditor = CodeMirror(textTextArea, {
    value: defaultText,
    mode: 'Plain Text',
    lineNumbers: true,
    styleSelectedText: true,
    lineWrapping: true
  });
  textEditor.on('change', replace);
  // substitution
  var substitutionTextArea = document.querySelector('div.substitution .editor');
  substitutionEditor = CodeMirror(substitutionTextArea, {
    mode: 'Plain Text',
    lineNumbers: true,
    styleSelectedText: true,
    lineWrapping: true,
    readOnly: true
  });
  // create initial instance and replace
  create();
});
