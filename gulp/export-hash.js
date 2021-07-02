import { Transform } from 'stream'

export const fileRegistry = new Map() // This is where we'll fetch the file names from

export const exportHash = () => {
  const stream = new Transform({ objectMode: true }) // Another stream

  stream._transform = function (chunk, _unused, callback) {
    const originalName = chunk.history[0].replace(chunk.base, '') // Find the original name the file had, it'll be the first entry in the file's `history` property
    const newName = chunk.history[chunk.history.length - 1].replace(
      chunk.base,
      ''
    ) // Remove the base path (ie `src/sass`), I think the content hashed files should be few enough to not have colliding file names

    fileRegistry.set(originalName, newName) // Store away the file name as an entry `index.css -> index-7025eefd346ef6f3abad8d51e5d43ffa.css`

    this.push(chunk) // Just continue, letting gulp know we finished
    callback()
  }

  return stream
}
