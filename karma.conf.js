// Karma configuration
// Generated on Mon Mar 13 2017 23:04:28 GMT+0100 (CET)

const SOURCES = ["dist/idb-file-storage.js"];
const TESTS = ["test/unit/common.js", "test/unit/**/test.*.js"];
const COVERAGE_DIR = "coverage/";

const preprocessors = {};
SOURCES.forEach(src => {
  preprocessors[src] = ["babel"];
});

module.exports = function (config) {
  config.set({

    // Base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "",

    // Frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["mocha", "chai", "chai-as-promised", "sinon"],

    // List of files / patterns to load in the browser
    files: [].concat(SOURCES, TESTS),

    // List of files to exclude
    exclude: [
      "~*",
      "#*"
    ],

    // Preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors,

    babelPreprocessor: {
      options: {
        // Do not transpile ES6 sources, babel is only used to hook up the
        // coverage instrumentation using babel-plugin-istanbul.
        //   presets: ['es2015'],
        sourceMap: "inline",
        plugins: ["babel-plugin-istanbul"]
      }
    },

    // Test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress", "coverage", "notify"],

    // Web server port
    port: 9876,

    // Enable / disable colors in the output (reporters and logs)
    colors: true,

    // Level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ["Firefox", "Chrome"],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    // NOTE: configured in the gulpfile.
    // singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    // Coverage reports
    coverageReporter: {
      reporters: [
        {type: "html", dir: COVERAGE_DIR},
        {type: "text"}
      ],
      instrumenterOptions: {
        istanbul: {noCompact: true}
      }
    },

    // Optional Notify Settings
    notifyReporter: {
      reportEachFailure: true,
      reportSuccess: true
    }
  });
};
