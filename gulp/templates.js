import toml from 'toml'
import pug from 'pug'
import { Transform } from 'stream'
import path from 'path'
import Vinyl from 'vinyl'

export const templates = ({ baseDir, templatesDir }) => {
  const stream = new Transform({ objectMode: true }) // Streams are at the heart of Gulp, helping us to transform all the files

  stream._transform = async function (chunk, _unused, callback) {
    const config = toml.parse(chunk.contents.toString()) // `chunk` represents the .toml file we're transforming into a template
    const templatePath = path.resolve(templatesDir, config.template) // inside the TOML file we specify which template file to use
    let result
    try {
      result = pug.compileFile(templatePath)(config) // By passing the config (TOML file) to the template all configuration keys will be available as variables
    } catch (e) {
      callback(e) // Oops, tell Gulp sometihng went wrong by passing the error to the callback
      return
    }

    let htmlFilePath = chunk.path.replace(/\.toml$/, '.html') // Reuse the template's name as the HTML file name
    if (!htmlFilePath.endsWith('/index.html')) {
      // if the file isn't already named index we want to create a directory with an index file to get the pretty URLs
      htmlFilePath = htmlFilePath.replace(/\.html$/, '/index.html')
    }

    // Vinyl is used to represent virtual files in Gulp. As we're transforming the `.toml` file we need to inform Gulp that now we have a `.html` file instead
    const resultingFile = new Vinyl({
      path: htmlFilePath,
      base: baseDir,
      contents: new Buffer(result),
    })

    callback(null, resultingFile) // Tell Gulp the transformation of this file is done. The `.toml` file is now a `.html` file
  }

  return stream // The `stream` is what'll be passed to `.pipe`
}
