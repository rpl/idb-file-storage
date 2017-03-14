const gulp = require('gulp');
const umd = require('gulp-umd');
const KarmaServer = require('karma').Server;

gulp.task('umd', function() {
  return gulp.src('src/idb-file-storage.js')
    .pipe(umd({
      exports: function(file) {
        return 'IDBFiles';
      },
      namespace: function(file) {
        return 'IDBFiles';
      }
    }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('watch', function() {
  gulp.watch('src/**/*.js', ['default']);
});

gulp.task('test:unit', function (done) {
  new KarmaServer({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('test:unit:watch', function (done) {
  new KarmaServer({
    configFile: __dirname + '/karma.conf.js',
    singleRun: false
  }, done).start();
});

gulp.task('test', ['default', 'test:unit']);
gulp.task('test:watch', ['default:watch', 'test:unit:watch']);

gulp.task('default', ['umd']);
gulp.task('default:watch', ['umd', 'watch']);
