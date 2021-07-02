import gulp from 'gulp'
import gulpSass from 'gulp-sass'
import nodeSass from 'node-sass'

const sass = gulpSass(nodeSass)

export const copyAssets = () =>
    gulp.src('assets/**/*') // Take any file inside the `assets` directory...
        .pipe(gulp.dest('dist/assets')) // ...and copy it to `dist/assets`

export const processSass = () =>
    gulp
        .src('src/sass/index.scss') // index.scss is our entrypoint
        .pipe(sass().on('error', sass.logError)) // Let Sass work its magic 🪄
        .pipe(gulp.dest('dist/css')) // Output directory is `dist/css`

export default gulp.series(copyAssets, processSass) // Run `copyAssets` when you run `yarn gulp`
