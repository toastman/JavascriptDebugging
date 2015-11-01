var config = {
  scripts: {
    app: {
      src: [
        'app/js/**/*.module.js',
        'app/js/**/*.js',
      ],
      dist: 'public/js',
      sourceMap: './maps'
    },
    vendor: {
      src: [
        'node_modules/angular/angular.js'
      ],
      dist: 'public/js'
    }
  },
  styles: {
    src: '../public/stylesheets/sass/main.scss',
    dist: '../public/stylesheets/css',
    sourceMap: './maps'
  }
};

var gulp = require('gulp'),
    ngAnnotate = require('gulp-ng-annotate'),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify');

gulp.task('scripts:app', function() {
  return gulp.src(config.scripts.app.src)
    .pipe(ngAnnotate())
    .pipe(sourcemaps.init())
    .pipe(concat('app.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write(config.scripts.app.sourceMap))
    .pipe(gulp.dest(config.scripts.app.dist));
});

gulp.task('scripts:debug', function() {
  return gulp.src(config.scripts.app.src)
    .pipe(ngAnnotate())
    .pipe(concat('app.debug.js'))
    .pipe(gulp.dest(config.scripts.app.dist));
});

gulp.task('scripts:vendor', function() {
  return gulp.src(config.scripts.vendor.src)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(config.scripts.vendor.dist));
});

gulp.task('watch', function() {
  gulp.watch(config.scripts.app.src, ['default']);
});

// Default task
gulp.task('default', ['scripts:app', 'scripts:vendor', 'scripts:debug']);
