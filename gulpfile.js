"use script";

const path = require("path");

const gulp = require("gulp");
const babel = require("gulp-babel");
const notify = require("gulp-notify");
const plumber = require("gulp-plumber");
const xo = require("gulp-xo");
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");
const KarmaServer = require("karma").Server;

// Cleanup pending watch on user exit.
process.on("SIGINT", () => {
  process.exit();
});

gulp.task("umd", () => {
  return gulp.src("src/idb-file-storage.js")
    // Log errors on console and desktop notification.
    .pipe(plumber({
      errorHandler(err) {
        console.error("UMD Build Error", err);
        this.emit("end");
        notify.onError("UMD Build Error: <%= error.message %>")(err);
      }
    }))
    // Run js linting on every build.
    .pipe(xo())
    // Wrap as an UMD module.
    .pipe(sourcemaps.init())
    .pipe(babel({
      babelrc: false,
      comments: true,
      plugins: [
        ["transform-es2015-modules-umd", {
          globals: {
            "idb-file-storage": "IDBFiles"
          },
          exactGlobals: true
        }]
      ],
      moduleId: "idb-file-storage"
    }))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist/"));
});

gulp.task("umd:minified", () => {
  return gulp.src("src/idb-file-storage.js")
    // Log errors on console and desktop notification.
    .pipe(plumber({
      errorHandler(err) {
        console.error("Minified UMD Build Error", err);
        this.emit("end");
        notify.onError("Minified UMD Build Error: <%= error.message %>")(err);
      }
    }))
    // Run js linting on every build.
    .pipe(xo())
    // Wrap as a minified UMD module.
    .pipe(sourcemaps.init())
    // Add the ".min" suffix to the generated minified files.
    .pipe(babel({
      babelrc: false,
      comments: false,
      presets: [
        ["babili", {
          // Disable mangle (because it currently mangles the named exports
          // and breaks the minified umd module, upstream issue:
          // https://github.com/babel/babili/issues/479).
          mangle: false
        }]
      ],
      plugins: [
        ["transform-es2015-modules-umd", {
          globals: {
            "idb-file-storage": "IDBFiles"
          },
          exactGlobals: true
        }]
      ],
      moduleId: "idb-file-storage"
    }))
    .pipe(rename({suffix: ".min"}))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist/"));
});

gulp.task("watch", () => {
  gulp.watch("src/**/*.js", ["default"]);
});

gulp.task("test:unit", done => {
  new KarmaServer({
    configFile: path.join(__dirname, "karma.conf.js"),
    singleRun: true
  }, done).start();
});

gulp.task("test:unit:watch", done => {
  new KarmaServer({
    configFile: path.join(__dirname, "karma.conf.js"),
    singleRun: false
  }, done).start();
});

gulp.task("test", ["default", "test:unit"]);
gulp.task("test:watch", ["default:watch", "test:unit:watch"]);

gulp.task("default", ["umd", "umd:minified"]);
gulp.task("default:watch", ["umd", "umd:minified", "watch"]);
