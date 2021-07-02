import toml from 'toml'
import marked from 'marked'
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
      const markdownedConfig = Object.entries(config) // Loop over every configuration key, as we want to check whether it should be parsed as markdown.
        .map(([key, value]) => {
          // If we prefix a string config value with `md:` that means we want to parse it as markdown
          if (typeof value === 'string' && value.startsWith('md:')) {
            return [key, marked(value.replace('md:', ''), {})] // remove the `md:` prefix and parse the rest as markdown. `.replace` will only replace the first occurrence so no worries if we happen to include `md:` in the actual content
          } else if (
            typeof value === 'string' &&
            // If we prefix the string config value with `inlinemd:` that means we want to parse it as inline markdown
            value.startsWith('inlinemd:')
          ) {
            return [key, marked.parseInline(value.replace('inlinemd:', ''), {})] // same thing as the `md:` prefix, but od it inline
          } else {
            // This should not be parsed as markdown
            return [key, value]
          }
        })
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}) // Put together the configuration as it was before, but with the parsed markdown

      result = pug.compileFile(templatePath)(markdownedConfig)
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
