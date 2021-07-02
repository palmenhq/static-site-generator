import gulp from 'gulp'
import gulpSass from 'gulp-sass'
import nodeSass from 'node-sass'
import path from 'path'
import { templates } from './gulp/templates.js'

const sass = gulpSass(nodeSass)

export const copyAssets = () =>
  gulp
    .src('assets/**/*') // Take any file inside the `assets` directory...
    .pipe(gulp.dest('dist/assets')) // ...and copy it to `dist/assets`

export const processSass = () =>
  gulp
    .src('src/sass/index.scss') // index.scss is our entrypoint
    .pipe(sass().on('error', sass.logError)) // Let Sass work its magic 🪄
    .pipe(gulp.dest('dist/css')) // Output directory is `dist/css`

const templatesDir = path.resolve(process.cwd(), 'src/templates') // Used for the `templates` function to know where to look for `index.pug`
const templatesBaseDir = path.resolve(process.cwd(), 'src/content') // Used for the `templates` function to know where the content base is.

export const processTemplates = () =>
  gulp
    .src('src/content/**/*.toml') // Apply the `templates` job on all `.toml` files in the `src/content` directory
    .pipe(templates({ baseDir: templatesBaseDir, templatesDir })) // actually run the job
    .pipe(gulp.dest('dist')) // Output the resulting HTML files directly in the `dist` directory

export default gulp.series(copyAssets, processSass, processTemplates)
