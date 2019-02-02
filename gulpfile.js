var gulp = require('gulp');  
var sourcemaps = require('gulp-sourcemaps');  
var ts = require('gulp-typescript');  
var babel = require('gulp-babel');
//var uglify = require('gulp-uglify');
var webpack = require('webpack-stream');

gulp.task('asl4', function () {
    var tsProject = ts.createProject('asl4/tsconfig.json');
      
    return gulp.src('asl4/asl4.ts')
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject))
        .pipe(babel())
        //.pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('.'));
});

gulp.task('webpack', function() {
    return gulp.src('quest.js')
        .pipe(webpack(require('./webpack.config.js')))
        .pipe(gulp.dest('dist/'));
});

gulp.task('lib', function () {
    return gulp.src('lib/**/*')
        .pipe(gulp.dest('dist/lib'));
});

gulp.task('ui', function () {
    return gulp.src('ui/**/*')
        .pipe(gulp.dest('dist/ui'));
});

gulp.task('files', function () {
    return gulp.src([
        '*.html',
        '*.asl',
        '*.aslx',
        '*.cas'
    ]).pipe(gulp.dest('dist'));
});

gulp.task('default', ['lib', 'ui', 'files']);