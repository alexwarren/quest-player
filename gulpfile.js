'use strict';

const gulp = require('gulp');  
const sourcemaps = require('gulp-sourcemaps');  
const ts = require('gulp-typescript');  
const babel = require('gulp-babel');
const webpack = require('webpack-stream');

gulp.task('asl4', () => {
    const tsProject = ts.createProject('asl4/tsconfig.json');
      
    return gulp.src('asl4/asl4.ts')
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(babel())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./asl4'));
});

gulp.task('webpack', () => {
    return gulp.src('quest.js')
        .pipe(webpack(require('./webpack.config.js')))
        .pipe(gulp.dest('dist/'));
});

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