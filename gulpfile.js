/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

'use strict';

// Include Gulp & tools we'll use
var gulp = require('gulp');
var git = require('gulp-git');


gulp.task('git', function(){
  gulp.src('./')
  .pipe(git.add())
  .pipe(git.commit('rie applied changes to synch with test'));
  git.push('origin', 'master', function (err) {
    if (err) throw err;
  });
});

