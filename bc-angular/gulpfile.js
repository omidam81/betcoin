'use strict';

var gulp = require('gulp'),
	livereload = require('gulp-livereload');


gulp.task('default', function() {
	livereload.listen();
	gulp.src(['build/**/*'])
		.pipe(livereload());
});