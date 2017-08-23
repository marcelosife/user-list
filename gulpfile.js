var gulp = require('gulp');
var jshint = require('gulp-jshint');
var paths = {
	scripts: 'modules/*.js'
};


gulp.task('watch', [], function () {
    gulp.watch(paths.scripts).on('change', function (event) {
        if (event.type === 'changed') {
            gulp.src(event.path)
                .pipe(jshint('.jshintrc'))
                .pipe(jshint.reporter('jshint-stylish'));
        }
    });
});

gulp.task('jshint', [], function () {
    gulp.src(paths.scripts)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'));
});