// Base

function clone(obj) {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}

class ScadBase {
  constructor(center) {
    this.type = this.constructor.name.toLowerCase();
    this.props = {};
    if (center !== undefined) {
      this.props.center = center;
    }
  }

  disable() {
    return Object.assign(clone(this), {_disable: true});
  }

  only() {
    return Object.assign(clone(this), {_showOnly: true});
  }

  debug() {
    return Object.assign(clone(this), {_debug: true});
  }

  update(newProps) {
    let ret = clone(this);
    ret.props = Object.assign({}, newProps, this.props);
    return ret;
  }

  linearExtrude(height, center) {
    class LinearExtrude extends ScadBase {
      constructor(children, height, center) {
        super(center);
        this.type = 'linear_extrude'; // Manually set the type as it doesn't match the class name
        this.children = children;
        this.set({height: height});
      }

      compile(out) {
        super.compile(out);
        out(this.dictToParams(this.props) + ') {\n');
        this.compileChildren(out);
        out('}\n');
      }
    }

    return new LinearExtrude([this], height, center);
  }

  set(newProps) {
    this.props = Object.assign({}, newProps, this.props);
  }

  typeToString(param) {
    if (param instanceof Array) {
      return '[' + param.reduce((x, y) => (x + ', ' + this.typeToString(y))) + ']';
    } else if ((param instanceof String) || (typeof param === 'string')) {
      return '"' + String(param) + '"';
    } else {
      return String(param);
    }
  }

  dictToParams(dict) {
    let ret = '';
    const keys = Object.keys(dict);
    let remaining = keys.length;
    for (const key of keys) {
      remaining--;

      ret += key + '=' + this.typeToString(dict[key]);

      if (remaining) {
        ret += ', ';
      }
    }

    return ret;
  }

  compile(out) {
    if (this._disable) {
      out('*');
    } else if (this._showOnly) {
      out('!');
    } else if (this._debug) {
      out('#');
    }
    out(this.type + '(');
  }

  compileChildren(out) {
    for (const child of this.children) {
      if (!child) {
        continue;
      }
      child.compile(out);
    }
  }
}

// Shape
class Shape extends ScadBase {
  compile(out) {
    super.compile(out);
    out(this.dictToParams(this.props));
    out(');\n');
  }
}

// 2D shapes
class Shape2D extends Shape {
}

class Circle extends Shape2D {
  constructor(radius) {
    super();
    this.set({r: radius});
  }
}

exports.circle = function(...args) {
  return new Circle(...args);
};

class Square extends Shape2D {
  constructor(size, center) {
    super(center);
    this.set({size: size});
  }
}

exports.square = function(...args) {
  return new Square(...args);
};

class Polygon extends Shape2D {
  constructor(points) {
    super();
    this.set({points: points});
  }
}

exports.polygon = function(...args) {
  return new Polygon(...args);
};

class Text extends Shape2D {
  constructor(text, size, font) {
    super();
    this.set({text: text, size: size, font: font});
  }
}

exports.text = function(...args) {
  return new Text(...args);
};

// 3D shapes
class Shape3D extends Shape {
}

class Sphere extends Shape3D {
  constructor(radius) {
    super();
    this.set({r: radius});
  }
}

exports.sphere = function(...args) {
  return new Sphere(...args);
};

class Cube extends Shape3D {
  constructor(size, center) {
    super(center);
    this.set({size: size});
  }
}

exports.cube = function(...args) {
  return new Cube(...args);
};

class Cylinder extends Shape3D {
  constructor(height, radius, center) {
    super(center);
    let props = {h: height};

    if (radius instanceof Array) {
      props.r1 = radius[0];
      props.r2 = radius[1];
    } else {
      props.r = radius;
    }

    this.set(props);
  }
}

exports.cylinder = function(...args) {
  return new Cylinder(...args);
};

// Container types

class Container extends ScadBase {
  constructor(...args) {
    super();
    this.children = args;
  }

  compile(out) {
    super.compile(out);
    out(') {\n');
    this.compileChildren(out);
    out('}\n');
  }
}

class Union extends Container {
}

exports.union = function(...args) {
  return new Union(...args);
};

class Difference extends Container {
}

exports.difference = function(...args) {
  return new Difference(...args);
};

class Intersection extends Container {
}

exports.intersection = function(...args) {
  return new Intersection(...args);
};

class Hull extends Container {
}

exports.hull = function(...args) {
  return new Hull(...args);
};

class Minkowski extends Container {
}

exports.minkowski = function(...args) {
  return new Minkowski(...args);
};

// Transformation

class Transformation extends ScadBase {
  constructor(param, ...children) {
    super();
    this.children = children;
    this.param = param;
  }

  compile(out) {
    super.compile(out);
    out(this.typeToString(this.param) + ') {\n');
    this.compileChildren(out);
    out('}\n');
  }
}

class Translate extends Transformation {
}

exports.translate = function(...args) {
  return new Translate(...args);
};

class Rotate extends Transformation {
}

exports.rotate = function(...args) {
  return new Rotate(...args);
};

class Scale extends Transformation {
}

exports.scale = function(...args) {
  return new Scale(...args);
};

class Resize extends Transformation {
}

exports.resize = function(...args) {
  return new Resize(...args);
};

class Mirror extends Transformation {
}

exports.mirror = function(...args) {
  return new Mirror(...args);
};

class Color extends Transformation {
}

exports.color = function(...args) {
  return new Color(...args);
};

// Raw
class RawOpenScad extends ScadBase {
  constructor(command, ...children) {
    super();
    if (command) {
      this.command = command;
    }
    this.children = children;
  }

  compile(out) {
    out(this.command);

    if (this.children) {
      out(' {');
      this.compileChildren(out);
      out('}\n');
    } else {
      out(';\n');
    }
  }
}
exports.RawOpenScad = RawOpenScad;

exports.raw = function(...args) {
  return new RawOpenScad(...args);
};

// Vectors

exports.vectorAdd = function(vector, value) {
  if (value instanceof Array) {
    return vector.map((x, idx) => (x + value[idx]));
  } else if (typeof value === 'number') {
    return vector.map((x) => (x + value));
  } else {
    throw Error();
  }
};

exports.vectorMultiply = function(vector, value) {
  if (typeof value === 'number') {
    return vector.map((x) => (x * value));
  } else {
    throw Error();
  }
};
