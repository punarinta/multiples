/**
 * The main problem here is that the input file may be infinite.
 * This means:
 *  - we cannot read the file as a whole
 *  - we cannot sort a final array because there is no final 🤷‍♂️
 *
 * We need to use streams (or file pointers). Also sorting of the content saved to file has to happen in situ.
 * Console sorting is possible, but is too hard to cover within 3 hours, as it would require video memory manipulations.
 * Also the test task says nothing about console sorting and only mentions that for the file.
 *
 * For type safety let's use TypeScript annotations in JSDoc.
 * Using TypeScript directly would simply make code less readable.
 *
 * [PAID CONTENT] Try out fully white label videoconferencing by xroom.app for your interviews.
 */

const
  fs = require('fs'),
  rl = require('readline')

// SECTION Types

/** @typedef {{ multiples: string, count: number }} Multiples */

/** @typedef {{ count: number, filePosition: number }} LinePosition */

// SECTION Constants

const
  inFileName = process.argv[2],
  outFileName = process.argv[3]

// SECTION State

/** Output file in-memory shadow */
let fileContent = ''

/** Useful for debugging in case of a corrupted input file */
let lineCounter = BigInt(0)

/** @type {Array<LinePosition>} */
const linePositions = []

// SECTION Utils

/** @type {(errMsg: string) => never} */
function quit (errMsg) {
  console.log(errMsg)

  process.exit(0)
}

function shutdown () {
  fs.closeSync(outFD)

  process.exit(0)
}

// SECTION Library

/** @type {(x: number, y: number, limit: number) => Multiples} */
function getMultiples (x, y, limit) {
  let
    count = 0,
    state1 = x,
    state2 = y,
    buffer = ''

  while (state1 < limit || state2 < limit) {
    if (state1 === state2) {
      buffer += `${state1} `

      ++count

      state1 += x
      state2 += y
    }

    else if (state1 < state2) {
      buffer += `${state1} `

      ++count

      state1 += x
    }

    else {
      buffer += `${state2} `

      ++count

      state2 += y
    }
  }

  return { count, multiples: `${limit}: ${buffer}` }
}

// Copy pasted binary search code from StackOverflow
/** @type {(array: ReadonlyArray<LinePosition>, numberCount: number) => number} */
function getLinePosition (array, numberCount) {
  const length = array.length

  let
    start = 0,
    end = length - 1

  while (start <= end) {
    let mid = Math.floor((start + end) / 2)

    /** @type {number} */
    // @ts-ignore
    const elem = array[mid].count

    if (elem === numberCount)
      return mid
    else if (elem < numberCount)
      start = mid + 1
    else
      end = mid - 1
  }

  return end + 1
}

// SECTION Commands

/** @type {(line: string) => void} */
function handleNextLine (line) {
  lineCounter++

  // Make sure the input line consists of exactly 3 numbers
  const numbers = line.split(' ').map(Number)

  if (numbers.some(Number.isNaN)) {
    quit(`Line ${lineCounter}: expected file input line to contain only numbers`)
  }

  // Destructuring to avoid TS warnings
  const [x, y, limit] = numbers

  if (false
    || x === undefined
    || y === undefined
    || limit === undefined
  ) {
    quit(`Line ${lineCounter}: expected file input line to contain 3 numbers`)
  }

  const result = getMultiples(x, y, limit)

  console.log(result.multiples)

  writeLineToFile(`${result.multiples}\n`, result.count)
}

/** @type {(line: string, numberCount: number) => void} */
function writeLineToFile (line, numberCount) {
  const position = getLinePosition(linePositions, numberCount)

  const prevFilePosition = position === 0 ? 0 : (() => {
    /** @type {LinePosition} */
    // @ts-ignore
    const prev = linePositions[position - 1]

    return prev.filePosition
  })()

  const filePosition = line.length + prevFilePosition

  /** @type {LinePosition} */
  const linePosition = {
    count: numberCount,
    filePosition,
  }

  linePositions.splice(position, 0, linePosition)

  for (let i = position + 1; i < linePositions.length; ++i) {
    /** @type {LinePosition} */
    // @ts-ignore
    const elem = linePositions[i]

    elem.filePosition += line.length
  }

  fileContent = `${fileContent.substr(0, prevFilePosition)}${line}${fileContent.substr(prevFilePosition)}`

  // @ts-ignore
  fs.writeFileSync(outFileName, fileContent)
}

// SECTION Program

// Make sure all file names are given and that the input file exists

if (inFileName === undefined) {
  quit('Input file name is required')
}

if (outFileName === undefined) {
  quit('Output file name is required')
}

if (!fs.existsSync(inFileName)) {
  quit('File with task doesn\'t exist')
}

if (fs.existsSync(outFileName)) {
  quit('Output file already exists. Program will be stopped to avoid its corruption.')
}

const
  outFD = fs.openSync(outFileName, 'w'),
  reader = rl.createInterface({ input: fs.createReadStream(inFileName) })

reader.on('line', handleNextLine)
reader.on('close', shutdown)
