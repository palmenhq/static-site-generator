import gulp from 'gulp'
import autoprefixer from 'gulp-autoprefixer'
import cssnano from 'gulp-cssnano'
import hash from 'gulp-hash-filename'
import liveReload from 'gulp-livereload'
import gulpMode from 'gulp-mode'
import gulpSass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import webpack from 'gulp-webpack'
import nodeSass from 'node-sass'
import path from 'path'
import { exportHash } from './gulp/export-hash.js'
import { templates } from './gulp/templates.js'

const sass = gulpSass(nodeSass)
const mode = gulpMode()

export const copyAssets = () =>
  gulp
    .src('assets/**/*') // Take any file inside the `assets` directory...
    .pipe(gulp.dest('dist/assets')) // ...and copy it to `dist/assets`

export const processJs =
  ({ watch }) =>
  () =>
    gulp
      .src('src/js/index.js')
      .pipe(
        webpack({
          watch,
          mode: mode.development() ? 'development' : 'production', // What to optimize for
          module: {
            rules: [
              // Rules let us define custom file transformers, for example bable
              {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                  loader: 'babel-loader', // Babel lets us use modern JS for older browsers
                  options: {
                    presets: ['@babel/preset-env'],
                  },
                },
              },
            ],
          },
          output: {
            filename: 'bundle.js',
          },
          devtool: mode.development() ? 'source-map' : 'none', // Instead of using `babel-sourcemap` here we want Webpack to take care of our source maps, as that's the plugin that will include all other JS files
        })
      )
      .pipe(mode.production(hash()))
      .pipe(exportHash())
      .pipe(mode.development(liveReload()))
      .pipe(gulp.dest('dist/js'))

export const processSass = () =>
  gulp
    .src('src/sass/index.scss') // index.scss is our entrypoint
    .pipe(mode.development(sourcemaps.init()))
    .pipe(sass().on('error', sass.logError)) // Let Sass work its magic 🪄
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['> 1%'],
      })
    )
    .pipe(cssnano())
    .pipe(mode.development(sourcemaps.write()))
    .pipe(mode.production(hash())) // Hash our content, but only when making a production build
    .pipe(mode.production(exportHash())) // Our brand new function to keep track of hashed file names
    .pipe(mode.development(liveReload()))
    .pipe(gulp.dest('dist/css')) // Output directory is `dist/css`

const templatesDir = path.resolve(process.cwd(), 'src/templates') // Used for the `templates` function to know where to look for `index.pug`
const templatesBaseDir = path.resolve(process.cwd(), 'src/content') // Used for the `templates` function to know where the content base is.

export const processTemplates = () =>
  gulp
    .src('src/content/**/*.toml') // Apply the `templates` job on all `.toml` files in the `src/content` directory
    .pipe(templates({ baseDir: templatesBaseDir, templatesDir })) // actually run the job
    .pipe(liveReload()) // No need to do this only for development, because here it dosen't affect the build
    .pipe(gulp.dest('dist')) // Output the resulting HTML files directly in the `dist` directory

export const watch = () => {
  gulp.watch(
    ['src/js/**/*.js'],
    { ignoreInitial: false },
    processJs({ watch: true })
  )
  gulp.watch(['src/scss/**/*.scss'], { ignoreInitial: false }, processSass)
  gulp.watch(['assets/**/*'], { ignoreInitial: false }, copyAssets)

  gulp.watch(
    ['src/content/**/*.toml', 'src/templates/**/*.pug'],
    { ignoreInitial: false },
    processTemplates
  )
  liveReload.listen()
}

export default gulp.series(
  copyAssets,
  processSass,
  processJs({ watch: false }),
  processTemplates
)
