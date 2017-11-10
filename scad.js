#!/usr/bin/env node

const fs = require('fs');

const libscadjs = require('./libscadjs.js');

const args = process.argv.splice(1);

if (args.length < 2) {
  console.error('Usage: ' + args[0] + ' <infile> [outfile]');
  process.exit(1);
}

const infile = args[1];
const outfile = args[2];

// Make all of libscadjs global
for (const name in libscadjs) {
  global[name] = libscadjs[name];
}

// Init the compiler output
const outstream = (outfile === undefined) ? process.stdout : fs.createWriteStream(outfile);

function out(text) {
  outstream.write(text);
}

libscadjs.RawOpenScad.text = (x) => (out(x + '\n'));

// Compile
try {
  // Load the file giving it access to our scope
  const main = (function() {
    eval(fs.readFileSync(infile, 'UTF8'));
    return main;
  })();

  main().compile(out);
} catch (err) {
  // On error, delete the output file
  if (outfile !== undefined) {
    fs.unlinkSync(outfile);
  }

  throw err;
}
