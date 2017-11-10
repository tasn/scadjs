# ScadJS

A tool for creating OpenScad files using JavaScript and an OpenScad like syntax!

## Why?

The OpenScad syntax is very limited and therefore makes a lot of things that
should be easy, quite hard. Even basic things like conditional variable
assignments can be a pain, not to mention complex data manipulations and logic.

ScadJS brings the power of JavaScript to OpenScad! Unlike [OpenJSCAD.org](https://openjscad.org/)
which reimplemented the scad engine, and is therefore have yet to reach feature
parity (for example, `hull()` and supporting different fonts), ScadJS just
converts your JavaScript code to `.scad`.

In addition, ScadJS supports OpenScad directives, so even you want to do some
things that ScadJS doesn't support, but OpenScad does, it's absolutely possible.
Integration is seamless.

## Installation

`npm install scadjs`

## Usage

`scadjs in.scadjs out.scad`

If the "out" file is omitted, the scadjs will print the generated scad to stdout.


You now should open the generated file in OpenScad. It's also recommended to
tick "Automatic Reload and Preview" from the "Design" menu in OpenScad, which
will reload the file every time it's updated by us.

## Syntax

The syntax is mostly very similar to OpenScad with the main difference being
changing curly blocks to function parameters, and changing some block statements
to object functions.

For example:

```
intersection() {
    cube(5);
    linear_extrude(5)
        circle(2);
}
```

Becomes:

```
intersection(
    cube(5),
    circle(2).linearExtrude(5)
}
```

Unfortunately there are no full docs at the moment, but you can take a look at
the constructors of the classes, and the classes themselves in [the library](/libscadjs.js),
to get an impression of what's possible and how to use everything. Generally,
most functions should have the same parameters as in [The OpenScad cheat sheet](http://www.openscad.org/cheatsheet/).


## Examples

**Note:** while ScadJS is already used in some projects, this is still in early
development and some things may change.

A basic example:

```javascript
function main() {
  return sphere(10);
}
```

A more complex example:

```javascript
const slice = true;

const radius = 5;
const dropAngle = 30 / 180 * Math.PI;

function randomSpheres() {
  let spheres = [];

  // Generate some random spheres of random sizes
  for (let i = Math.floor(2 + Math.random() * 4) ; i >= 0 ; i--) {
    spheres.push(sphere(radius * (Math.random() + 0.5)))
  }

  // Actually, we forgot, we need to also randomly distribute them around the space
  return spheres.map((sphere) => (translate([Math.random() * 20, Math.random() * 20, -20], sphere)));
}

function main() {
  const drop = union(
    sphere(radius),
    translate([0, 0, radius * Math.sin(dropAngle)],
      cylinder(7, [radius * Math.cos(dropAngle), 0]),
    ),
  );

  let slicer = null; // null is a valid "empty" shape
  if (slice) {
    // slice a star
    slicer = translate([0, -5, 0],
      text("*", 16, "Sans")
        .update({halign: 'center'}) // Set more OpenScad parameters on the text shape
        .linearExtrude(radius).debug(),
    );
  }

  return union(
    difference(
      drop.debug(), // debug highlight this shape
      slicer,
    ),
    union(
      ...randomSpheres(), // spread the spheres as parameters
    ),
  );
}
```

Raw OpenScad:

```javascript
function main() {
  // Change the OpenScad resolution, not yet implemented in ScadJS
  RawOpenScad.text('$fn = 100;');

  // The below raw directives are implement in ScadJS and are just used for illustration
  return union(
    raw("intersection() ",
      sphere(5),
      translate([0, 0, -1],
        raw("cube(4)"),
      ),
    ),
    translate([0, 0, 2],
      cube(2)
    )
  );
}
```


## Contributing

There is no style guide yet, but please take care to maintain the existing
coding style.

Please also run `npm run lint` to verify your code complies with whatever
checks we do have in place.

### Todo

* Support missing OpenScad shapes and directives
* Docs
* Type checking (and thus better error messages)
* Tests
* Automatic "watch" capabilities that will generate the `.scad` code whenever the source `.scadjs` file changes
