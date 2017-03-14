"use script";

const path = require("path");

const gulp = require("gulp");
const notify = require("gulp-notify");
const plumber = require("gulp-plumber");
const umd = require("gulp-umd");
const xo = require("gulp-xo");
const KarmaServer = require("karma").Server;

// Cleanup pending watch on user exit.
process.on('SIGINT', function() {
  process.exit();
});

gulp.task("umd", function () {
  return gulp.src("src/idb-file-storage.js")
    // Log errors on console and desktop notification.
    .pipe(plumber({
      errorHandler: function (err) {
        console.error("UMD Build Error", err);
        this.emit('end');
        notify.onError("UMD Build Error: <%= error.message %>")(err);
      }
    }))
    // Run js linting on every build.
    .pipe(xo())
    // Wrap as an UMD module.
    .pipe(umd({
      exports: function () {
        return "IDBFiles";
      },
      namespace: function () {
        return "IDBFiles";
      }
    }))
    .pipe(gulp.dest("dist/"));
});

gulp.task("watch", function () {
  gulp.watch("src/**/*.js", ["default"]);
});

gulp.task("test:unit", function (done) {
  new KarmaServer({
    configFile: path.join(__dirname, "karma.conf.js"),
    singleRun: true
  }, done).start();
});

gulp.task("test:unit:watch", function (done) {
  new KarmaServer({
    configFile: path.join(__dirname, "karma.conf.js"),
    singleRun: false
  }, done).start();
});

gulp.task("test", ["default", "test:unit"]);
gulp.task("test:watch", ["default:watch", "test:unit:watch"]);

gulp.task("default", ["umd"]);
gulp.task("default:watch", ["umd", "watch"]);
