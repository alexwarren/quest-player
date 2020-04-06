'use strict';

const gulp = require('gulp');  

gulp.task('lib', () => {
    return gulp.src('lib/**/*')
        .pipe(gulp.dest('dist/lib'));
});

gulp.task('ui', () => {
    return gulp.src('ui/**/*')
        .pipe(gulp.dest('dist/ui'));
});

gulp.task('examples', () => {
    return gulp.src('examples/**/*')
        .pipe(gulp.dest('dist'));
});

gulp.task('files', () => {
    return gulp.src([
        '*.html'
    ]).pipe(gulp.dest('dist'));
});

gulp.task('default', gulp.series('lib', 'ui', 'examples', 'files'));