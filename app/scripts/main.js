
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

// TODO: block when async methods

var _applause;

var replace = function() {
  var start = Date.now();
  var sourceValue = textEditor.getValue();
  var result = _applause.replace(sourceValue);
  var matches = [];
  var content = sourceValue;
  var doc = textEditor.getDoc();
  // clear all marks
  var marks = doc.getAllMarks();
  marks.forEach(function(mark) {
    mark.clear();
  });
  if (result.count > 0) {
    (result.detail || []).forEach(function(detail) {
      var re = detail.match;
      var match;
      while ((match = re.exec(sourceValue)) !== null) {
        // highlight
        var from = doc.posFromIndex(match.index);
        var to = doc.posFromIndex(match.index + match[0].length);
        // console.log('Mark text', from, to);
        doc.markText(from, to, {
          className: 'match-background'
        });
        // detail
        var matchDetail = {
          match: match[0],
          start: match.index,
          end: match.index + match[0].length - 1
        };
        matches.push(matchDetail);
        // console.log('Match detail', matchDetail);
        if (!re.global) { // or it will become infinite.
          break;
        }
      }
    });
    content = result.content;
  }
  // console.log('Replace matches', matches);
  // update view
  var count = matches.length;
  var matchesDom = $('.options .results').removeClass('hidden');
  if (count === 0) {
    matchesDom.text('No matches');
  } else if (count === 1) {
    matchesDom.text('1 match');
  } else {
    matchesDom.text(count + ' matches');
  }
  // trace
  console.log('Replace took ' + (Date.now() - start) + ' ms');
  // update result
  substitutionEditor.setValue(content, 1);
};

var create = function() {
  var optionsValue = eval('(' + optionsEditor.getValue() + ')');
  // console.log('Create applause instance with:', optionsValue);
  // create new applause instance
  _applause = Applause.create($.extend({}, optionsValue, {
    // force
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
    lineWrapping: true
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
  textEditor = CodeMirror(textTextArea, {
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
    // value: defaultOptions,
    readOnly: true,
    styleSelectedText: true,
    lineWrapping: true
  });
  // create initial instance and replace
  create();
});
