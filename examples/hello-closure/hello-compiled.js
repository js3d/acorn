// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 *
 * @provideGoog
 */


/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is
 * already defined in the current scope before assigning to prevent
 * clobbering if base.js is loaded more than once.
 *
 * @const
 */
var goog = goog || {}; // Identifies this file as the Closure base.


/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.LOCALE = 'en';  // default to en


/**
 * Creates object stubs for a namespace.  The presence of one or more
 * goog.provide() calls indicate that the file defines the given
 * objects/namespaces.  Build tools also scan for provide/require statements
 * to discern dependencies, build dependency files (see deps.js), etc.
 * @see goog.require
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part".
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice. This is intended
    // to teach new developers that 'goog.provide' is effectively a variable
    // declaration. And when JSCompiler transforms goog.provide into a real
    // variable declaration, the compiled JS should work the same as the raw
    // JS--even when the raw JS uses goog.provide incorrectly.
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


/**
 * Marks that the current file should only be used for testing, and never for
 * live code in production.
 * @param {string=} opt_message Optional message to add to the error that's
 *     raised when used in production code.
 */
goog.setTestOnly = function(opt_message) {
  if (COMPILED && !goog.DEBUG) {
    opt_message = opt_message || '';
    throw Error('Importing test-only code into non-debug environment' +
                opt_message ? ': ' + opt_message : '.');
  }
};


if (!COMPILED) {

  /**
   * Check if the given name has been goog.provided. This will return false for
   * names that are available only as implicit namespaces.
   * @param {string} name name of the object to look for.
   * @return {boolean} Whether the name has been provided.
   * @private
   */
  goog.isProvided_ = function(name) {
    return !goog.implicitNamespaces_[name] && !!goog.getObjectByName(name);
  };

  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares
   * that 'goog' and 'goog.events' must be namespaces.
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Returns an object based on its fully qualified external name.  If you are
 * using a compilation pass that renames property names beware that using this
 * function will not find renamed properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {?} The value (object or primitive) or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {Array} provides An array of strings with the names of the objects
 *                         this file provides.
 * @param {Array} requires An array of strings with the names of the objects
 *                         this file requires.
 */
goog.addDependency = function(relPath, provides, requires) {
  if (!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};




// NOTE(nnaze): The debug DOM loader was included in base.js as an orignal
// way to do "debug-mode" development.  The dependency system can sometimes
// be confusing, as can the debug DOM loader's asyncronous nature.
//
// With the DOM loader, a call to goog.require() is not blocking -- the
// script will not load until some point after the current script.  If a
// namespace is needed at runtime, it needs to be defined in a previous
// script, or loaded via require() with its registered dependencies.
// User-defined namespaces may need their own deps file.  See http://go/js_deps,
// http://go/genjsdeps, or, externally, DepsWriter.
// http://code.google.com/closure/library/docs/depswriter.html
//
// Because of legacy clients, the DOM loader can't be easily removed from
// base.js.  Work is being done to make it disableable or replaceable for
// different environments (DOM-less JavaScript interpreters like Rhino or V8,
// for example). See bootstrap/ for more information.


/**
 * @define {boolean} Whether to enable the debug loader.
 *
 * If enabled, a call to goog.require() will attempt to load the namespace by
 * appending a script tag to the DOM (if the namespace has been registered).
 *
 * If disabled, goog.require() will simply assert that the namespace has been
 * provided (and depend on the fact that some outside tool correctly ordered
 * the script).
 */
goog.ENABLE_DEBUG_LOADER = true;


/**
 * Implements a system for the dynamic resolution of dependencies
 * that works in parallel with the BUILD system. Note that all calls
 * to goog.require will be stripped by the JSCompiler when the
 * --closure_pass option is used.
 * @see goog.provide
 * @param {string} name Namespace to include (as was given in goog.provide())
 *     in the form "goog.package.part".
 */
goog.require = function(name) {

  // if the object already exists we do not need do do anything
  // TODO(arv): If we start to support require based on file name this has
  //            to change
  // TODO(arv): If we allow goog.foo.* this has to change
  // TODO(arv): If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      return;
    }

    if (goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if (path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return;
      }
    }

    var errorMessage = 'goog.require could not find: ' + name;
    if (goog.global.console) {
      goog.global.console['error'](errorMessage);
    }


      throw Error(errorMessage);

  }
};


/**
 * Path for included scripts
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default,
 * the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * A function to import a single script. This is meant to be overridden when
 * Closure is being run in non-HTML contexts, such as web workers. It's defined
 * in the global scope so that it can be set before base.js is loaded, which
 * allows deps.js to be imported properly.
 *
 * The function is passed the script source, which is a relative URI. It should
 * return true if the script was imported, false otherwise.
 */
goog.global.CLOSURE_IMPORT_SCRIPT;


/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
goog.nullFunction = function() {};


/**
 * The identity function. Returns its first argument.
 *
 * @param {*=} opt_returnValue The single value that will be returned.
 * @param {...*} var_args Optional trailing arguments. These are ignored.
 * @return {?} The first argument. We can't know the type -- just pass it along
 *      without type.
 * @deprecated Use goog.functions.identity instead.
 */
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue;
};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 *
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error
 * will be thrown when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as
 * an argument because that would make it more difficult to obfuscate
 * our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be
 *   overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always return the same instance
 * object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    if (goog.DEBUG) {
      // NOTE: JSCompiler can't optimize away Array#push.
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
    }
    return ctor.instance_ = new ctor;
  };
};


/**
 * All singleton classes that have been instantiated, for testing. Don't read
 * it directly, use the {@code goog.testing.singleton} module. The compiler
 * removes this variable if unused.
 * @type {!Array.<!Function>}
 * @private
 */
goog.instantiatedSingletons_ = [];


if (!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  /**
   * Object used to keep track of urls that have already been added. This
   * record allows the prevention of circular dependencies.
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 to many
    nameToPath: {}, // 1 to 1
    requires: {}, // 1 to many
    // used when resolving dependencies to prevent us from
    // visiting the file twice
    visited: {},
    written: {} // used to keep track of script files we have written
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of the base.js script that bootstraps Closure
   * @private
   */
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName('script');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf('?');
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Imports a script if, and only if, that script hasn't already been imported.
   * (Must be called at execution time)
   * @param {string} src Script source.
   * @private
   */
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;
    if (!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /**
   * The default implementation of the import function. Writes a script tag to
   * import the script.
   *
   * @param {string} src The script source.
   * @return {boolean} True if the script was imported, false otherwise.
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_()) {
      var doc = goog.global.document;

      // If the user tries to require a new symbol after document load,
      // something has gone terribly wrong. Doing a document.write would
      // wipe out the page.
      if (doc.readyState == 'complete') {
        // Certain test frameworks load base.js multiple times, which tries
        // to write deps.js each time. If that happens, just fail silently.
        // These frameworks wipe the page between each load of base.js, so this
        // is OK.
        var isDeps = /\bdeps.js$/.test(src);
        if (isDeps) {
          return false;
        } else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }

      doc.write(
          '<script type="text/javascript" src="' + src + '"></' + 'script>');
      return true;
    } else {
      return false;
    }
  };


  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls importScript_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    // the scripts we need to write this time
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // we have already visited this one. We can get here if we have cyclic
      // dependencies
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          // If the required name is defined, we assume that it was already
          // bootstrapped by other means.
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error('Undefined nameToPath for ' + requireName);
            }
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // Check these first, so we can avoid calling Object.prototype.toString if
      // possible.
      //
      // IE improperly marshals tyepof across execution contexts, but a
      // cross-context object will still return false for "instanceof Object".
      if (value instanceof Array) {
        return 'array';
      } else if (value instanceof Object) {
        return s;
      }

      // HACK: In order to use an Object prototype method on the arbitrary
      //   value, the compiler requires the value be cast to type Object,
      //   even though the ECMA spec explicitly allows it.
      var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
      // In Firefox 3.6, attempting to access iframe window objects' length
      // property throws an NS_ERROR_FAILURE, so we need to special-case it
      // here.
      if (className == '[object Window]') {
        return 'object';
      }

      // We cannot always use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if ((className == '[object Array]' ||
           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if ((className == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }


    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // In Safari typeof nodeList returns 'function', and on Firefox
    // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
    // and RegExps.  We would like to return object for those and we can
    // detect an invalid function by making sure that the function
    // object has a call method.
    return 'object';
  }
  return s;
};


/**
 * Returns true if the specified value is not |undefined|.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * Returns true if the specified value is |null|
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like
 * the value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays
 * and functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = typeof val;
  return type == 'object' && val != null || type == 'function';
  // return Object(val) === val also works, but is slower, especially if val is
  // not an object.
};


/**
 * Gets a unique ID for an object. This mutates the object so that further
 * calls with the same object as a parameter returns the same value. The unique
 * ID is guaranteed to be unique across the current session amongst objects that
 * are passed into {@code getUid}. There is no guarantee that the ID is unique
 * or consistent across sessions. It is unsafe to generate unique ID for
 * function prototypes.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // DOM nodes in IE are not instance of Object and throws exception
  // for delete. Instead we try to use removeAttribute
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure javascript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' +
    Math.floor(Math.random() * 2147483648).toString(36);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * A native implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 * @suppress {deprecated} The compiler thinks that Function.prototype.bind
 *     is deprecated because some people have declared a pure-JS version.
 *     Only the pure-JS version is truly deprecated.
 */
goog.bindNative_ = function(fn, selfObj, var_args) {
  return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
};


/**
 * A pure-JS implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 */
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw new Error();
  }

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };

  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of |this| 'pre-specified'.<br><br>
 *
 * Remaining arguments specified at call-time are appended to the pre-
 * specified ones.<br><br>
 *
 * Also see: {@link #partial}.<br><br>
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @suppress {deprecated} See above.
 */
goog.bind = function(fn, selfObj, var_args) {
  // TODO(nicksantos): narrow the type signature.
  if (Function.prototype.bind &&
      // NOTE(nicksantos): Somebody pulled base.js into the default
      // Chrome extension environment. This means that for Chrome extensions,
      // they get the implementation of Function.prototype.bind that
      // calls goog.bind instead of the native one. Even worse, we don't want
      // to introduce a circular dependency between goog.bind and
      // Function.prototype.bind, so we have to hack this to make sure it
      // works correctly.
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Prepend the bound arguments to the current arguments.
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals javascript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Optional obfuscation style for CSS class names. Should be set to either
 * 'BY_WHOLE' or 'BY_PART' if defined.
 * @type {string|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * This function works in tandem with @see goog.setCssNameMapping.
 *
 * Without any mapping set, the arguments are simple joined with a
 * hyphen and passed through unaltered.
 *
 * When there is a mapping, there are two possible styles in which
 * these mappings are used. In the BY_PART style, each part (i.e. in
 * between hyphens) of the passed in css name is rewritten according
 * to the map. In the BY_WHOLE style, the full css name is looked up in
 * the map directly. If a rewrite is not specified by the map, the
 * compiler will output a warning.
 *
 * When the mapping is passed to the compiler, it will replace calls
 * to goog.getCssName with the strings from the mapping, e.g.
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If one argument is passed it will be processed, if two are passed
 * only the modifier will be processed, as it is assumed the first
 * argument was generated as a result of calling goog.getCssName.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };

  var renameByParts = function(cssName) {
    // Remap all the parts individually.
    var parts = cssName.split('-');
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join('-');
  };

  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == 'BY_WHOLE' ?
        getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }

  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 * @param {string=} opt_style The style of css name mapping. There are two valid
 *     options: 'BY_PART', and 'BY_WHOLE'.
 * @see goog.getCssName for a description.
 */
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};


/**
 * To use CSS renaming in compiled mode, one of the input files should have a
 * call to goog.setCssNameMapping() with an object literal that the JSCompiler
 * can extract and use to replace all calls to goog.getCssName(). In uncompiled
 * mode, JavaScript code should be loaded before this base.js file that declares
 * a global variable, CLOSURE_CSS_NAME_MAPPING, which is used below. This is
 * to ensure that the mapping is loaded before any calls to goog.getCssName()
 * are made in uncompiled mode.
 *
 * A hook for overriding the CSS name mapping.
 * @type {Object|undefined}
 */
goog.global.CLOSURE_CSS_NAME_MAPPING;


if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  // This does not call goog.setCssNameMapping() because the JSCompiler
  // requires that goog.setCssNameMapping() be called with an object literal.
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}


/**
 * Gets a localized message.
 *
 * This function is a compiler primitive. If you give the compiler a localized
 * message bundle, it will replace the string at compile-time with a localized
 * version, and expand goog.getMsg call to a concatenated string.
 *
 * Messages must be initialized in the form:
 * <code>
 * var MSG_NAME = goog.getMsg('Hello {$placeholder}', {'placeholder': 'world'});
 * </code>
 *
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};


/**
 * Gets a localized message. If the message does not have a translation, gives a
 * fallback message.
 *
 * This is useful when introducing a new message that has not yet been
 * translated into all languages.
 *
 * This function is a compiler primtive. Must be used in the form:
 * <code>var x = goog.getMsgWithFallback(MSG_A, MSG_B);</code>
 * where MSG_A and MSG_B were initialized with goog.getMsg.
 *
 * @param {string} a The preferred message.
 * @param {string} b The fallback message.
 * @return {string} The best translated message.
 */
goog.getMsgWithFallback = function(a, b) {
  return a;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * goog.exportProperty
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. goog.exportSymbol('public.path.Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction',
 *                       Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   goog.base(this, a, b);
 * }
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * contructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass
 * the name of the method as the second argument to this function. If
 * you do not, you will get a runtime error. This calls the superclass'
 * method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express
 * inheritance relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the
 * compiler will do macro expansion to remove a lot of
 * the extra overhead that this function introduces. The compiler
 * will also enforce a lot of the assumptions that this function
 * makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain,
  // then one of two things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the
 * aliases applied.  In uncompiled code the function is simply run since the
 * aliases as written are valid JavaScript.
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *    (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};


// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Provides a base class for custom Error objects such that the
 * stack is correctly maintained.
 *
 * You should never need to throw goog.debug.Error(msg) directly, Error(msg) is
 * sufficient.
 *
 */

goog.provide('goog.debug.Error');



/**
 * Base class for custom error objects.
 * @param {*=} opt_msg The message associated with the error.
 * @constructor
 * @extends {Error}
 */
goog.debug.Error = function(opt_msg) {

  // Ensure there is a stack trace.
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error);
  } else {
    this.stack = new Error().stack || '';
  }

  if (opt_msg) {
    this.message = String(opt_msg);
  }
};
goog.inherits(goog.debug.Error, Error);


/** @override */
goog.debug.Error.prototype.name = 'CustomError';
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for string manipulation.
 */


/**
 * Namespace for string utilities
 */
goog.provide('goog.string');
goog.provide('goog.string.Unicode');


/**
 * Common Unicode string characters.
 * @enum {string}
 */
goog.string.Unicode = {
  NBSP: '\xa0'
};


/**
 * Fast prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix A string to look for at the start of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix}.
 */
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0;
};


/**
 * Fast suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix}.
 */
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l;
};


/**
 * Case-insensitive prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix  A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(
      prefix, str.substr(0, prefix.length)) == 0;
};


/**
 * Case-insensitive suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(
      suffix, str.substr(str.length - suffix.length, suffix.length)) == 0;
};


/**
 * Does simple python-style string substitution.
 * subs("foo%s hot%s", "bar", "dog") becomes "foobar hotdog".
 * @param {string} str The string containing the pattern.
 * @param {...*} var_args The items to substitute into the pattern.
 * @return {string} A copy of {@code str} in which each occurrence of
 *     {@code %s} has been replaced an argument from {@code var_args}.
 */
goog.string.subs = function(str, var_args) {
  // This appears to be slow, but testing shows it compares more or less
  // equivalent to the regex.exec method.
  for (var i = 1; i < arguments.length; i++) {
    // We cast to String in case an argument is a Function.  Replacing $&, for
    // example, with $$$& stops the replace from subsituting the whole match
    // into the resultant string.  $$$& in the first replace becomes $$& in the
    //  second, which leaves $& in the resultant string.  Also:
    // $$, $`, $', $n $nn
    var replacement = String(arguments[i]).replace(/\$/g, '$$$$');
    str = str.replace(/\%s/, replacement);
  }
  return str;
};


/**
 * Converts multiple whitespace chars (spaces, non-breaking-spaces, new lines
 * and tabs) to a single space, and strips leading and trailing whitespace.
 * @param {string} str Input string.
 * @return {string} A copy of {@code str} with collapsed whitespace.
 */
goog.string.collapseWhitespace = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+/g, ' ').replace(/^\s+|\s+$/g, '');
};


/**
 * Checks if a string is empty or contains only whitespaces.
 * @param {string} str The string to check.
 * @return {boolean} True if {@code str} is empty or whitespace only.
 */
goog.string.isEmpty = function(str) {
  // testing length == 0 first is actually slower in all browsers (about the
  // same in Opera).
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return /^[\s\xa0]*$/.test(str);
};


/**
 * Checks if a string is null, undefined, empty or contains only whitespaces.
 * @param {*} str The string to check.
 * @return {boolean} True if{@code str} is null, undefined, empty, or
 *     whitespace only.
 */
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str));
};


/**
 * Checks if a string is all breaking whitespace.
 * @param {string} str The string to check.
 * @return {boolean} Whether the string is all breaking whitespace.
 */
goog.string.isBreakingWhitespace = function(str) {
  return !/[^\t\n\r ]/.test(str);
};


/**
 * Checks if a string contains all letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} consists entirely of letters.
 */
goog.string.isAlpha = function(str) {
  return !/[^a-zA-Z]/.test(str);
};


/**
 * Checks if a string contains only numbers.
 * @param {*} str string to check. If not a string, it will be
 *     casted to one.
 * @return {boolean} True if {@code str} is numeric.
 */
goog.string.isNumeric = function(str) {
  return !/[^0-9]/.test(str);
};


/**
 * Checks if a string contains only numbers or letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} is alphanumeric.
 */
goog.string.isAlphaNumeric = function(str) {
  return !/[^a-zA-Z0-9]/.test(str);
};


/**
 * Checks if a character is a space character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a space.
 */
goog.string.isSpace = function(ch) {
  return ch == ' ';
};


/**
 * Checks if a character is a valid unicode character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a valid unicode character.
 */
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= ' ' && ch <= '~' ||
         ch >= '\u0080' && ch <= '\uFFFD';
};


/**
 * Takes a string and replaces newlines with a space. Multiple lines are
 * replaced with a single space.
 * @param {string} str The string from which to strip newlines.
 * @return {string} A copy of {@code str} stripped of newlines.
 */
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, ' ');
};


/**
 * Replaces Windows and Mac new lines with unix style: \r or \r\n with \n.
 * @param {string} str The string to in which to canonicalize newlines.
 * @return {string} {@code str} A copy of {@code} with canonicalized newlines.
 */
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, '\n');
};


/**
 * Normalizes whitespace in a string, replacing all whitespace chars with
 * a space.
 * @param {string} str The string in which to normalize whitespace.
 * @return {string} A copy of {@code str} with all whitespace normalized.
 */
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, ' ');
};


/**
 * Normalizes spaces in a string, replacing all consecutive spaces and tabs
 * with a single space. Replaces non-breaking space with a space.
 * @param {string} str The string in which to normalize spaces.
 * @return {string} A copy of {@code str} with all consecutive spaces and tabs
 *    replaced with a single space.
 */
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, ' ');
};


/**
 * Removes the breaking spaces from the left and right of the string and
 * collapses the sequences of breaking spaces in the middle into single spaces.
 * The original and the result strings render the same way in HTML.
 * @param {string} str A string in which to collapse spaces.
 * @return {string} Copy of the string with normalized breaking spaces.
 */
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, ' ').replace(
      /^[\t\r\n ]+|[\t\r\n ]+$/g, '');
};


/**
 * Trims white spaces to the left and right of a string.
 * @param {string} str The string to trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trim = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
};


/**
 * Trims whitespaces at the left end of a string.
 * @param {string} str The string to left trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimLeft = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+/, '');
};


/**
 * Trims whitespaces at the right end of a string.
 * @param {string} str The string to right trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimRight = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+$/, '');
};


/**
 * A string comparator that ignores case.
 * -1 = str1 less than str2
 *  0 = str1 equals str2
 *  1 = str1 greater than str2
 *
 * @param {string} str1 The string to compare.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} The comparator result, as described above.
 */
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();

  if (test1 < test2) {
    return -1;
  } else if (test1 == test2) {
    return 0;
  } else {
    return 1;
  }
};


/**
 * Regular expression used for splitting a string into substrings of fractional
 * numbers, integers, and non-numeric characters.
 * @type {RegExp}
 * @private
 */
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;


/**
 * String comparison function that handles numbers in a way humans might expect.
 * Using this function, the string "File 2.jpg" sorts before "File 10.jpg". The
 * comparison is mostly case-insensitive, though strings that are identical
 * except for case are sorted with the upper-case strings before lower-case.
 *
 * This comparison function is significantly slower (about 500x) than either
 * the default or the case-insensitive compare. It should not be used in
 * time-critical code, but should be fast enough to sort several hundred short
 * strings (like filenames) with a reasonable delay.
 *
 * @param {string} str1 The string to compare in a numerically sensitive way.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} less than 0 if str1 < str2, 0 if str1 == str2, greater than
 *     0 if str1 > str2.
 */
goog.string.numerateCompare = function(str1, str2) {
  if (str1 == str2) {
    return 0;
  }
  if (!str1) {
    return -1;
  }
  if (!str2) {
    return 1;
  }

  // Using match to split the entire string ahead of time turns out to be faster
  // for most inputs than using RegExp.exec or iterating over each character.
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);

  var count = Math.min(tokens1.length, tokens2.length);

  for (var i = 0; i < count; i++) {
    var a = tokens1[i];
    var b = tokens2[i];

    // Compare pairs of tokens, returning if one token sorts before the other.
    if (a != b) {

      // Only if both tokens are integers is a special comparison required.
      // Decimal numbers are sorted as strings (e.g., '.09' < '.1').
      var num1 = parseInt(a, 10);
      if (!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if (!isNaN(num2) && num1 - num2) {
          return num1 - num2;
        }
      }
      return a < b ? -1 : 1;
    }
  }

  // If one string is a substring of the other, the shorter string sorts first.
  if (tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length;
  }

  // The two strings must be equivalent except for case (perfect equality is
  // tested at the head of the function.) Revert to default ASCII-betical string
  // comparison to stablize the sort.
  return str1 < str2 ? -1 : 1;
};


/**
 * URL-encodes a string
 * @param {*} str The string to url-encode.
 * @return {string} An encoded copy of {@code str} that is safe for urls.
 *     Note that '#', ':', and other characters used to delimit portions
 *     of URLs *will* be encoded.
 */
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str));
};


/**
 * URL-decodes the string. We need to specially handle '+'s because
 * the javascript library doesn't convert them to spaces.
 * @param {string} str The string to url decode.
 * @return {string} The decoded {@code str}.
 */
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, ' '));
};


/**
 * Converts \n to <br>s or <br />s.
 * @param {string} str The string in which to convert newlines.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} A copy of {@code str} with converted newlines.
 */
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? '<br />' : '<br>');
};


/**
 * Escape double quote '"' characters in addition to '&', '<', and '>' so that a
 * string can be included in an HTML tag attribute value within double quotes.
 *
 * It should be noted that > doesn't need to be escaped for the HTML or XML to
 * be valid, but it has been decided to escape it for consistency with other
 * implementations.
 *
 * NOTE(user):
 * HtmlEscape is often called during the generation of large blocks of HTML.
 * Using statics for the regular expressions and strings is an optimization
 * that can more than half the amount of time IE spends in this function for
 * large apps, since strings and regexes both contribute to GC allocations.
 *
 * Testing for the presence of a character before escaping increases the number
 * of function calls, but actually provides a speed increase for the average
 * case -- since the average case often doesn't require the escaping of all 4
 * characters and indexOf() is much cheaper than replace().
 * The worst case does suffer slightly from the additional calls, therefore the
 * opt_isLikelyToContainHtmlChars option has been included for situations
 * where all 4 HTML entities are very likely to be present and need escaping.
 *
 * Some benchmarks (times tended to fluctuate +-0.05ms):
 *                                     FireFox                     IE6
 * (no chars / average (mix of cases) / all 4 chars)
 * no checks                     0.13 / 0.22 / 0.22         0.23 / 0.53 / 0.80
 * indexOf                       0.08 / 0.17 / 0.26         0.22 / 0.54 / 0.84
 * indexOf + re test             0.07 / 0.17 / 0.28         0.19 / 0.50 / 0.85
 *
 * An additional advantage of checking if replace actually needs to be called
 * is a reduction in the number of object allocations, so as the size of the
 * application grows the difference between the various methods would increase.
 *
 * @param {string} str string to be escaped.
 * @param {boolean=} opt_isLikelyToContainHtmlChars Don't perform a check to see
 *     if the character needs replacing - use this option if you expect each of
 *     the characters to appear often. Leave false if you expect few html
 *     characters to occur in your strings, such as if you are escaping HTML.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {

  if (opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, '&amp;')
          .replace(goog.string.ltRe_, '&lt;')
          .replace(goog.string.gtRe_, '&gt;')
          .replace(goog.string.quotRe_, '&quot;');

  } else {
    // quick test helps in the case when there are no chars to replace, in
    // worst case this makes barely a difference to the time taken
    if (!goog.string.allRe_.test(str)) return str;

    // str.indexOf is faster than regex.test in this case
    if (str.indexOf('&') != -1) {
      str = str.replace(goog.string.amperRe_, '&amp;');
    }
    if (str.indexOf('<') != -1) {
      str = str.replace(goog.string.ltRe_, '&lt;');
    }
    if (str.indexOf('>') != -1) {
      str = str.replace(goog.string.gtRe_, '&gt;');
    }
    if (str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, '&quot;');
    }
    return str;
  }
};


/**
 * Regular expression that matches an ampersand, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.amperRe_ = /&/g;


/**
 * Regular expression that matches a less than sign, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.ltRe_ = /</g;


/**
 * Regular expression that matches a greater than sign, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.gtRe_ = />/g;


/**
 * Regular expression that matches a double quote, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.quotRe_ = /\"/g;


/**
 * Regular expression that matches any character that needs to be escaped.
 * @type {RegExp}
 * @private
 */
goog.string.allRe_ = /[&<>\"]/;


/**
 * Unescapes an HTML string.
 *
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapeEntities = function(str) {
  if (goog.string.contains(str, '&')) {
    // We are careful not to use a DOM if we do not have one. We use the []
    // notation so that the JSCompiler will not complain about these objects and
    // fields in the case where we have no DOM.
    if ('document' in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str);
    } else {
      // Fall back on pure XML entities
      return goog.string.unescapePureXmlEntities_(str);
    }
  }
  return str;
};


/**
 * Unescapes an HTML string using a DOM to resolve non-XML, non-numeric
 * entities. This function is XSS-safe and whitespace-preserving.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} The unescaped {@code str} string.
 */
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"'};
  var div = document.createElement('div');
  // Match as many valid entity characters as possible. If the actual entity
  // happens to be shorter, it will still work as innerHTML will return the
  // trailing characters unchanged. Since the entity characters do not include
  // open angle bracket, there is no chance of XSS from the innerHTML use.
  // Since no whitespace is passed to innerHTML, whitespace is preserved.
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    // Check for cached entity.
    var value = seen[s];
    if (value) {
      return value;
    }
    // Check for numeric entity.
    if (entity.charAt(0) == '#') {
      // Prefix with 0 so that hex entities (e.g. &#x10) parse as hex numbers.
      var n = Number('0' + entity.substr(1));
      if (!isNaN(n)) {
        value = String.fromCharCode(n);
      }
    }
    // Fall back to innerHTML otherwise.
    if (!value) {
      // Append a non-entity character to avoid a bug in Webkit that parses
      // an invalid entity at the end of innerHTML text as the empty string.
      div.innerHTML = s + ' ';
      // Then remove the trailing character from the result.
      value = div.firstChild.nodeValue.slice(0, -1);
    }
    // Cache and return.
    return seen[s] = value;
  });
};


/**
 * Unescapes XML entities.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch (entity) {
      case 'amp':
        return '&';
      case 'lt':
        return '<';
      case 'gt':
        return '>';
      case 'quot':
        return '"';
      default:
        if (entity.charAt(0) == '#') {
          // Prefix with 0 so that hex entities (e.g. &#x10) parse as hex.
          var n = Number('0' + entity.substr(1));
          if (!isNaN(n)) {
            return String.fromCharCode(n);
          }
        }
        // For invalid entities we just return the entity
        return s;
    }
  });
};


/**
 * Regular expression that matches an HTML entity.
 * See also HTML5: Tokenization / Tokenizing character references.
 * @private
 * @type {!RegExp}
 */
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;


/**
 * Do escaping of whitespace to preserve spatial formatting. We use character
 * entity #160 to make it safer for xml.
 * @param {string} str The string in which to escape whitespace.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, ' &#160;'), opt_xml);
};


/**
 * Strip quote characters around a string.  The second argument is a string of
 * characters to treat as quotes.  This can be a single character or a string of
 * multiple character and in that case each of those are treated as possible
 * quote characters. For example:
 *
 * <pre>
 * goog.string.stripQuotes('"abc"', '"`') --> 'abc'
 * goog.string.stripQuotes('`abc`', '"`') --> 'abc'
 * </pre>
 *
 * @param {string} str The string to strip.
 * @param {string} quoteChars The quote characters to strip.
 * @return {string} A copy of {@code str} without the quotes.
 */
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for (var i = 0; i < length; i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if (str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1);
    }
  }
  return str;
};


/**
 * Truncates a string to a certain length and adds '...' if necessary.  The
 * length also accounts for the ellipsis, so a maximum length of 10 and a string
 * 'Hello World!' produces 'Hello W...'.
 * @param {string} str The string to truncate.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cut off in the middle.
 * @return {string} The truncated {@code str} string.
 */
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (str.length > chars) {
    str = str.substring(0, chars - 3) + '...';
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Truncate a string in the middle, adding "..." if necessary,
 * and favoring the beginning of the string.
 * @param {string} str The string to truncate the middle of.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cutoff in the middle.
 * @param {number=} opt_trailingChars Optional number of trailing characters to
 *     leave at the end of the string, instead of truncating as close to the
 *     middle as possible.
 * @return {string} A truncated copy of {@code str}.
 */
goog.string.truncateMiddle = function(str, chars,
    opt_protectEscapedCharacters, opt_trailingChars) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (opt_trailingChars && str.length > chars) {
    if (opt_trailingChars > chars) {
      opt_trailingChars = chars;
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + '...' + str.substring(endPoint);
  } else if (str.length > chars) {
    // Favor the beginning of the string:
    var half = Math.floor(chars / 2);
    var endPos = str.length - half;
    half += chars % 2;
    str = str.substring(0, half) + '...' + str.substring(endPos);
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Special chars that need to be escaped for goog.string.quote.
 * @private
 * @type {Object}
 */
goog.string.specialEscapeChars_ = {
  '\0': '\\0',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\x0B': '\\x0B', // '\v' is not supported in JScript
  '"': '\\"',
  '\\': '\\\\'
};


/**
 * Character mappings used internally for goog.string.escapeChar.
 * @private
 * @type {Object}
 */
goog.string.jsEscapeCache_ = {
  '\'': '\\\''
};


/**
 * Encloses a string in double quotes and escapes characters so that the
 * string is a valid JS string.
 * @param {string} s The string to quote.
 * @return {string} A copy of {@code s} surrounded by double quotes.
 */
goog.string.quote = function(s) {
  s = String(s);
  if (s.quote) {
    return s.quote();
  } else {
    var sb = ['"'];
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] ||
          ((cc > 31 && cc < 127) ? ch : goog.string.escapeChar(ch));
    }
    sb.push('"');
    return sb.join('');
  }
};


/**
 * Takes a string and returns the escaped string for that character.
 * @param {string} str The string to escape.
 * @return {string} An escaped string representing {@code str}.
 */
goog.string.escapeString = function(str) {
  var sb = [];
  for (var i = 0; i < str.length; i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i));
  }
  return sb.join('');
};


/**
 * Takes a character and returns the escaped string for that character. For
 * example escapeChar(String.fromCharCode(15)) -> "\\x0E".
 * @param {string} c The character to escape.
 * @return {string} An escaped string representing {@code c}.
 */
goog.string.escapeChar = function(c) {
  if (c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c];
  }

  if (c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c];
  }

  var rv = c;
  var cc = c.charCodeAt(0);
  if (cc > 31 && cc < 127) {
    rv = c;
  } else {
    // tab is 9 but handled above
    if (cc < 256) {
      rv = '\\x';
      if (cc < 16 || cc > 256) {
        rv += '0';
      }
    } else {
      rv = '\\u';
      if (cc < 4096) { // \u1000
        rv += '0';
      }
    }
    rv += cc.toString(16).toUpperCase();
  }

  return goog.string.jsEscapeCache_[c] = rv;
};


/**
 * Takes a string and creates a map (Object) in which the keys are the
 * characters in the string. The value for the key is set to true. You can
 * then use goog.object.map or goog.array.map to change the values.
 * @param {string} s The string to build the map from.
 * @return {Object} The map of characters used.
 */
// TODO(arv): It seems like we should have a generic goog.array.toMap. But do
//            we want a dependency on goog.array in goog.string?
goog.string.toMap = function(s) {
  var rv = {};
  for (var i = 0; i < s.length; i++) {
    rv[s.charAt(i)] = true;
  }
  return rv;
};


/**
 * Checks whether a string contains a given substring.
 * @param {string} s The string to test.
 * @param {string} ss The substring to test for.
 * @return {boolean} True if {@code s} contains {@code ss}.
 */
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1;
};


/**
 * Returns the non-overlapping occurrences of ss in s.
 * If either s or ss evalutes to false, then returns zero.
 * @param {string} s The string to look in.
 * @param {string} ss The string to look for.
 * @return {number} Number of occurrences of ss in s.
 */
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0;
};


/**
 * Removes a substring of a specified length at a specific
 * index in a string.
 * @param {string} s The base string from which to remove.
 * @param {number} index The index at which to remove the substring.
 * @param {number} stringLength The length of the substring to remove.
 * @return {string} A copy of {@code s} with the substring removed or the full
 *     string if nothing is removed or the input is invalid.
 */
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  // If the index is greater or equal to 0 then remove substring
  if (index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) +
        s.substr(index + stringLength, s.length - index - stringLength);
  }
  return resultStr;
};


/**
 *  Removes the first occurrence of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), '');
  return s.replace(re, '');
};


/**
 *  Removes all occurrences of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), 'g');
  return s.replace(re, '');
};


/**
 * Escapes characters in the string that are not safe to use in a RegExp.
 * @param {*} s The string to escape. If not a string, it will be casted
 *     to one.
 * @return {string} A RegExp safe, escaped copy of {@code s}.
 */
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
      replace(/\x08/g, '\\x08');
};


/**
 * Repeats a string n times.
 * @param {string} string The string to repeat.
 * @param {number} length The number of times to repeat.
 * @return {string} A string containing {@code length} repetitions of
 *     {@code string}.
 */
goog.string.repeat = function(string, length) {
  return new Array(length + 1).join(string);
};


/**
 * Pads number to given length and optionally rounds it to a given precision.
 * For example:
 * <pre>padNumber(1.25, 2, 3) -> '01.250'
 * padNumber(1.25, 2) -> '01.25'
 * padNumber(1.25, 2, 1) -> '01.3'
 * padNumber(1.25, 0) -> '1.25'</pre>
 *
 * @param {number} num The number to pad.
 * @param {number} length The desired length.
 * @param {number=} opt_precision The desired precision.
 * @return {string} {@code num} as a string with the given options.
 */
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf('.');
  if (index == -1) {
    index = s.length;
  }
  return goog.string.repeat('0', Math.max(0, length - index)) + s;
};


/**
 * Returns a string representation of the given object, with
 * null and undefined being returned as the empty string.
 *
 * @param {*} obj The object to convert.
 * @return {string} A string representation of the {@code obj}.
 */
goog.string.makeSafe = function(obj) {
  return obj == null ? '' : String(obj);
};


/**
 * Concatenates string expressions. This is useful
 * since some browsers are very inefficient when it comes to using plus to
 * concat strings. Be careful when using null and undefined here since
 * these will not be included in the result. If you need to represent these
 * be sure to cast the argument to a String first.
 * For example:
 * <pre>buildString('a', 'b', 'c', 'd') -> 'abcd'
 * buildString(null, undefined) -> ''
 * </pre>
 * @param {...*} var_args A list of strings to concatenate. If not a string,
 *     it will be casted to one.
 * @return {string} The concatenation of {@code var_args}.
 */
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, '');
};


/**
 * Returns a string with at least 64-bits of randomness.
 *
 * Doesn't trust Javascript's random function entirely. Uses a combination of
 * random and current timestamp, and then encodes the string in base-36 to
 * make it shorter.
 *
 * @return {string} A random string, e.g. sn1s7vb4gcic.
 */
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) +
         Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36);
};


/**
 * Compares two version numbers.
 *
 * @param {string|number} version1 Version of first item.
 * @param {string|number} version2 Version of second item.
 *
 * @return {number}  1 if {@code version1} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code version2} is higher.
 */
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  // Trim leading and trailing whitespace and split the versions into
  // subversions.
  var v1Subs = goog.string.trim(String(version1)).split('.');
  var v2Subs = goog.string.trim(String(version2)).split('.');
  var subCount = Math.max(v1Subs.length, v2Subs.length);

  // Iterate over the subversions, as long as they appear to be equivalent.
  for (var subIdx = 0; order == 0 && subIdx < subCount; subIdx++) {
    var v1Sub = v1Subs[subIdx] || '';
    var v2Sub = v2Subs[subIdx] || '';

    // Split the subversions into pairs of numbers and qualifiers (like 'b').
    // Two different RegExp objects are needed because they are both using
    // the 'g' flag.
    var v1CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    var v2CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ['', '', ''];
      var v2Comp = v2CompParser.exec(v2Sub) || ['', '', ''];
      // Break if there are no more matches.
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }

      // Parse the numeric part of the subversion. A missing number is
      // equivalent to 0.
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);

      // Compare the subversion components. The number has the highest
      // precedence. Next, if the numbers are equal, a subversion without any
      // qualifier is always higher than a subversion with any qualifier. Next,
      // the qualifiers are compared as strings.
      order = goog.string.compareElements_(v1CompNum, v2CompNum) ||
          goog.string.compareElements_(v1Comp[2].length == 0,
              v2Comp[2].length == 0) ||
          goog.string.compareElements_(v1Comp[2], v2Comp[2]);
      // Stop as soon as an inequality is discovered.
    } while (order == 0);
  }

  return order;
};


/**
 * Compares elements of a version number.
 *
 * @param {string|number|boolean} left An element from a version number.
 * @param {string|number|boolean} right An element from a version number.
 *
 * @return {number}  1 if {@code left} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code right} is higher.
 * @private
 */
goog.string.compareElements_ = function(left, right) {
  if (left < right) {
    return -1;
  } else if (left > right) {
    return 1;
  }
  return 0;
};


/**
 * Maximum value of #goog.string.hashCode, exclusive. 2^32.
 * @type {number}
 * @private
 */
goog.string.HASHCODE_MAX_ = 0x100000000;


/**
 * String hash function similar to java.lang.String.hashCode().
 * The hash code for a string is computed as
 * s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
 * where s[i] is the ith character of the string and n is the length of
 * the string. We mod the result to make it between 0 (inclusive) and 2^32
 * (exclusive).
 * @param {string} str A string.
 * @return {number} Hash value for {@code str}, between 0 (inclusive) and 2^32
 *  (exclusive). The empty string returns 0.
 */
goog.string.hashCode = function(str) {
  var result = 0;
  for (var i = 0; i < str.length; ++i) {
    result = 31 * result + str.charCodeAt(i);
    // Normalize to 4 byte range, 0 ... 2^32.
    result %= goog.string.HASHCODE_MAX_;
  }
  return result;
};


/**
 * The most recent unique ID. |0 is equivalent to Math.floor in this case.
 * @type {number}
 * @private
 */
goog.string.uniqueStringCounter_ = Math.random() * 0x80000000 | 0;


/**
 * Generates and returns a string which is unique in the current document.
 * This is useful, for example, to create unique IDs for DOM elements.
 * @return {string} A unique id.
 */
goog.string.createUniqueString = function() {
  return 'goog_' + goog.string.uniqueStringCounter_++;
};


/**
 * Converts the supplied string to a number, which may be Ininity or NaN.
 * This function strips whitespace: (toNumber(' 123') === 123)
 * This function accepts scientific notation: (toNumber('1e1') === 10)
 *
 * This is better than Javascript's built-in conversions because, sadly:
 *     (Number(' ') === 0) and (parseFloat('123a') === 123)
 *
 * @param {string} str The string to convert.
 * @return {number} The number the supplied string represents, or NaN.
 */
goog.string.toNumber = function(str) {
  var num = Number(str);
  if (num == 0 && goog.string.isEmpty(str)) {
    return NaN;
  }
  return num;
};


/**
 * Converts a string from selector-case to camelCase (e.g. from
 * "multi-part-string" to "multiPartString"), useful for converting
 * CSS selectors and HTML dataset keys to their equivalent JS properties.
 * @param {string} str The string in selector-case form.
 * @return {string} The string in camelCase form.
 */
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase();
  });
};


/**
 * Converts a string from camelCase to selector-case (e.g. from
 * "multiPartString" to "multi-part-string"), useful for converting JS
 * style and dataset properties to equivalent CSS selectors and HTML keys.
 * @param {string} str The string in camelCase form.
 * @return {string} The string in selector-case form.
 */
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, '-$1').toLowerCase();
};


/**
 * Converts a string into TitleCase. First character of the string is always
 * capitalized in addition to the first letter of every subsequent word.
 * Words are delimited by one or more whitespaces by default. Custom delimiters
 * can optionally be specified to replace the default, which doesn't preserve
 * whitespace delimiters and instead must be explicitly included if needed.
 *
 * Default delimiter => " ":
 *    goog.string.toTitleCase('oneTwoThree')    => 'OneTwoThree'
 *    goog.string.toTitleCase('one two three')  => 'One Two Three'
 *    goog.string.toTitleCase('  one   two   ') => '  One   Two   '
 *    goog.string.toTitleCase('one_two_three')  => 'One_two_three'
 *    goog.string.toTitleCase('one-two-three')  => 'One-two-three'
 *
 * Custom delimiter => "_-.":
 *    goog.string.toTitleCase('oneTwoThree', '_-.')       => 'OneTwoThree'
 *    goog.string.toTitleCase('one two three', '_-.')     => 'One two three'
 *    goog.string.toTitleCase('  one   two   ', '_-.')    => '  one   two   '
 *    goog.string.toTitleCase('one_two_three', '_-.')     => 'One_Two_Three'
 *    goog.string.toTitleCase('one-two-three', '_-.')     => 'One-Two-Three'
 *    goog.string.toTitleCase('one...two...three', '_-.') => 'One...Two...Three'
 *    goog.string.toTitleCase('one. two. three', '_-.')   => 'One. two. three'
 *    goog.string.toTitleCase('one-two.three', '_-.')     => 'One-Two.Three'
 *
 * @param {string} str String value in camelCase form.
 * @param {string=} opt_delimiters Custom delimiter character set used to
 *      distinguish words in the string value. Each character represents a
 *      single delimiter. When provided, default whitespace delimiter is
 *      overridden and must be explicitly included if needed.
 * @return {string} String value in TitleCase form.
 */
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ?
      goog.string.regExpEscape(opt_delimiters) : '\\s';

  // For IE8, we need to prevent using an empty character set. Otherwise,
  // incorrect matching will occur.
  delimiters = delimiters ? '|[' + delimiters + ']+' : '';

  var regexp = new RegExp('(^' + delimiters + ')([a-z])', 'g');
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase();
  });
};


/**
 * Parse a string in decimal or hexidecimal ('0xFFFF') form.
 *
 * To parse a particular radix, please use parseInt(string, radix) directly. See
 * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/parseInt
 *
 * This is a wrapper for the built-in parseInt function that will only parse
 * numbers as base 10 or base 16.  Some JS implementations assume strings
 * starting with "0" are intended to be octal. ES3 allowed but discouraged
 * this behavior. ES5 forbids it.  This function emulates the ES5 behavior.
 *
 * For more information, see Mozilla JS Reference: http://goo.gl/8RiFj
 *
 * @param {string|number|null|undefined} value The value to be parsed.
 * @return {number} The number, parsed. If the string failed to parse, this
 *     will be NaN.
 */
goog.string.parseInt = function(value) {
  // Force finite numbers to strings.
  if (isFinite(value)) {
    value = String(value);
  }

  if (goog.isString(value)) {
    // If the string starts with '0x' or '-0x', parse as hex.
    return /^\s*-?0x/i.test(value) ?
        parseInt(value, 16) : parseInt(value, 10);
  }

  return NaN;
};
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities to check the preconditions, postconditions and
 * invariants runtime.
 *
 * Methods in this package should be given special treatment by the compiler
 * for type-inference. For example, <code>goog.asserts.assert(foo)</code>
 * will restrict <code>foo</code> to a truthy value.
 *
 * The compiler has an option to disable asserts. So code like:
 * <code>
 * var x = goog.asserts.assert(foo()); goog.asserts.assert(bar());
 * </code>
 * will be transformed into:
 * <code>
 * var x = foo();
 * </code>
 * The compiler will leave in foo() (because its return value is used),
 * but it will remove bar() because it assumes it does not have side-effects.
 *
 */

goog.provide('goog.asserts');
goog.provide('goog.asserts.AssertionError');

goog.require('goog.debug.Error');
goog.require('goog.string');


/**
 * @define {boolean} Whether to strip out asserts or to leave them in.
 */
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;



/**
 * Error object for failed assertions.
 * @param {string} messagePattern The pattern that was used to form message.
 * @param {!Array.<*>} messageArgs The items to substitute into the pattern.
 * @constructor
 * @extends {goog.debug.Error}
 */
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  // Remove the messagePattern afterwards to avoid permenantly modifying the
  // passed in array.
  messageArgs.shift();

  /**
   * The message pattern used to format the error message. Error handlers can
   * use this to uniquely identify the assertion.
   * @type {string}
   */
  this.messagePattern = messagePattern;
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);


/** @override */
goog.asserts.AssertionError.prototype.name = 'AssertionError';


/**
 * Throws an exception with the given message and "Assertion failed" prefixed
 * onto it.
 * @param {string} defaultMessage The message to use if givenMessage is empty.
 * @param {Array.<*>} defaultArgs The substitution arguments for defaultMessage.
 * @param {string|undefined} givenMessage Message supplied by the caller.
 * @param {Array.<*>} givenArgs The substitution arguments for givenMessage.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 * @private
 */
goog.asserts.doAssertFailure_ =
    function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = 'Assertion failed';
  if (givenMessage) {
    message += ': ' + givenMessage;
    var args = givenArgs;
  } else if (defaultMessage) {
    message += ': ' + defaultMessage;
    args = defaultArgs;
  }
  // The '' + works around an Opera 10 bug in the unit tests. Without it,
  // a stack trace is added to var message above. With this, a stack trace is
  // not added until this line (it causes the extra garbage to be added after
  // the assertion message instead of in the middle of it).
  throw new goog.asserts.AssertionError('' + message, args || []);
};


/**
 * Checks if the condition evaluates to true if goog.asserts.ENABLE_ASSERTS is
 * true.
 * @param {*} condition The condition to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {*} The value of the condition.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
goog.asserts.assert = function(condition, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_('', null, opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return condition;
};


/**
 * Fails if goog.asserts.ENABLE_ASSERTS is true. This function is useful in case
 * when we want to add a check in the unreachable area like switch-case
 * statement:
 *
 * <pre>
 *  switch(type) {
 *    case FOO: doSomething(); break;
 *    case BAR: doSomethingElse(); break;
 *    default: goog.assert.fail('Unrecognized type: ' + type);
 *      // We have only 2 types - "default:" section is unreachable code.
 *  }
 * </pre>
 *
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} Failure.
 */
goog.asserts.fail = function(opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError(
        'Failure' + (opt_message ? ': ' + opt_message : ''),
        Array.prototype.slice.call(arguments, 1));
  }
};


/**
 * Checks if the value is a number if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {number} The value, guaranteed to be a number when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 */
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_('Expected number but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {number} */ (value);
};


/**
 * Checks if the value is a string if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {string} The value, guaranteed to be a string when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a string.
 */
goog.asserts.assertString = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_('Expected string but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {string} */ (value);
};


/**
 * Checks if the value is a function if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Function} The value, guaranteed to be a function when asserts
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a function.
 */
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_('Expected function but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Function} */ (value);
};


/**
 * Checks if the value is an Object if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Object} The value, guaranteed to be a non-null object.
 * @throws {goog.asserts.AssertionError} When the value is not an object.
 */
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_('Expected object but got %s: %s.',
        [goog.typeOf(value), value],
        opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Object} */ (value);
};


/**
 * Checks if the value is an Array if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Array} The value, guaranteed to be a non-null array.
 * @throws {goog.asserts.AssertionError} When the value is not an array.
 */
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_('Expected array but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Array} */ (value);
};


/**
 * Checks if the value is a boolean if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {boolean} The value, guaranteed to be a boolean when asserts are
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a boolean.
 */
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_('Expected boolean but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {boolean} */ (value);
};


/**
 * Checks if the value is an instance of the user-defined type if
 * goog.asserts.ENABLE_ASSERTS is true.
 *
 * The compiler may tighten the type returned by this function.
 *
 * @param {*} value The value to check.
 * @param {!Function} type A user-defined constructor.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the value is not an instance of
 *     type.
 * @return {!Object}
 */
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_('instanceof check failed.', null,
        opt_message, Array.prototype.slice.call(arguments, 3));
  }
  return /** @type {!Object} */(value);
};

// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating arrays.
 *
 */


goog.provide('goog.array');
goog.provide('goog.array.ArrayLike');

goog.require('goog.asserts');


/**
 * @define {boolean} NATIVE_ARRAY_PROTOTYPES indicates whether the code should
 * rely on Array.prototype functions, if available.
 *
 * The Array.prototype functions can be defined by external libraries like
 * Prototype and setting this flag to false forces closure to use its own
 * goog.array implementation.
 *
 * If your javascript can be loaded by a third party site and you are wary about
 * relying on the prototype functions, specify
 * "--define goog.NATIVE_ARRAY_PROTOTYPES=false" to the JSCompiler.
 */
goog.NATIVE_ARRAY_PROTOTYPES = true;


/**
 * @typedef {Array|NodeList|Arguments|{length: number}}
 */
goog.array.ArrayLike;


/**
 * Returns the last element in an array without removing it.
 * @param {goog.array.ArrayLike} array The array.
 * @return {*} Last item in array.
 */
goog.array.peek = function(array) {
  return array[array.length - 1];
};


/**
 * Reference to the original {@code Array.prototype}.
 * @private
 */
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;


// NOTE(arv): Since most of the array functions are generic it allows you to
// pass an array-like object. Strings have a length and are considered array-
// like. However, the 'in' operator does not work on strings so we cannot just
// use the array path even if the browser supports indexing into strings. We
// therefore end up splitting the string.


/**
 * Returns the index of the first element of an array with a specified
 * value, or -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-indexof}
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} obj The object for which we are searching.
 * @param {number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at index 0.
 * @return {number} The index of the first matching array element.
 */
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES &&
                     goog.array.ARRAY_PROTOTYPE_.indexOf ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ?
          0 : (opt_fromIndex < 0 ?
               Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex);

      if (goog.isString(arr)) {
        // Array.prototype.indexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.indexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i < arr.length; i++) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Returns the index of the last element of an array with a specified value, or
 * -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-lastindexof}
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} obj The object for which we are searching.
 * @param {?number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at the end of the array.
 * @return {number} The index of the last matching array element.
 */
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES &&
                         goog.array.ARRAY_PROTOTYPE_.lastIndexOf ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr.length != null);

      // Firefox treats undefined and null as 0 in the fromIndex argument which
      // leads it to always return -1
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
      return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;

      if (fromIndex < 0) {
        fromIndex = Math.max(0, arr.length + fromIndex);
      }

      if (goog.isString(arr)) {
        // Array.prototype.lastIndexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.lastIndexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i >= 0; i--) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Calls a function for each element in an array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-foreach}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this: S, T, number, ?): ?} f The function to call for every
 *     element.
 *     This function takes 3 arguments (the element, the index and the array).
 *     The return value is ignored. The function is called only for indexes of
 *     the array which have assigned values; it is not called for indexes which
 *     have been deleted or which have never been assigned values.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @template T,S
 */
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES &&
                     goog.array.ARRAY_PROTOTYPE_.forEach ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          f.call(opt_obj, arr2[i], i, arr);
        }
      }
    };


/**
 * Calls a function for each element in an array, starting from the last
 * element rather than the first.
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this: S, T, number, ?): ?} f The function to call for every
 *     element. This function
 *     takes 3 arguments (the element, the index and the array). The return
 *     value is ignored.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @template T,S
 */
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; --i) {
    if (i in arr2) {
      f.call(opt_obj, arr2[i], i, arr);
    }
  }
};


/**
 * Calls a function for each element in an array, and if the function returns
 * true adds the element to a new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-filter}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):boolean} f The function to call for
 *     every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array} a new array in which only elements that passed the test are
 *     present.
 * @template T,S
 */
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES &&
                    goog.array.ARRAY_PROTOTYPE_.filter ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = [];
      var resLength = 0;
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          var val = arr2[i];  // in case f mutates arr2
          if (f.call(opt_obj, val, i, arr)) {
            res[resLength++] = val;
          }
        }
      }
      return res;
    };


/**
 * Calls a function for each element in an array and inserts the result into a
 * new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-map}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):?} f The function to call for every
 *     element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return something. The result will be inserted into a new array.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array} a new array with the results from f.
 * @template T,S
 */
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES &&
                 goog.array.ARRAY_PROTOTYPE_.map ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = new Array(l);
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          res[i] = f.call(opt_obj, arr2[i], i, arr);
        }
      }
      return res;
    };


/**
 * Passes every element of an array into a function and accumulates the result.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduce}
 *
 * For example:
 * var a = [1, 2, 3, 4];
 * goog.array.reduce(a, function(r, v, i, arr) {return r + v;}, 0);
 * returns 10
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, R, T, number, ?) : R} f The function to call for
 *     every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {?} val The initial value to pass into the function on the first call.
 * @param {S=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {R} Result of evaluating f repeatedly across the values of the array.
 * @template T,S,R
 */
goog.array.reduce = function(arr, f, val, opt_obj) {
  if (arr.reduce) {
    if (opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val);
    } else {
      return arr.reduce(f, val);
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};


/**
 * Passes every element of an array into a function and accumulates the result,
 * starting from the last element and working towards the first.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduceright}
 *
 * For example:
 * var a = ['a', 'b', 'c'];
 * goog.array.reduceRight(a, function(r, v, i, arr) {return r + v;}, '');
 * returns 'cba'
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, R, T, number, ?) : R} f The function to call for
 *     every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {?} val The initial value to pass into the function on the first call.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {R} Object returned as a result of evaluating f repeatedly across the
 *     values of the array.
 * @template T,S,R
 */
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if (arr.reduceRight) {
    if (opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val);
    } else {
      return arr.reduceRight(f, val);
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};


/**
 * Calls f for each element of an array. If any call returns true, some()
 * returns true (without checking the remaining elements). If all calls
 * return false, some() returns false.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-some}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} true if any element passes the test.
 * @template T,S
 */
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES &&
                  goog.array.ARRAY_PROTOTYPE_.some ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
          return true;
        }
      }
      return false;
    };


/**
 * Call f for each element of an array. If all calls return true, every()
 * returns true. If any call returns false, every() returns false and
 * does not continue to check the remaining elements.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-every}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} false if any element fails the test.
 * @template T,S
 */
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES &&
                   goog.array.ARRAY_PROTOTYPE_.every ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
          return false;
        }
      }
      return true;
    };


/**
 * Search an array for the first element that satisfies a given condition and
 * return that element.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {T} The first array element that passes the test, or null if no
 *     element is found.
 * @template T,S
 */
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array for the first element that satisfies a given condition and
 * return its index.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the first array element that passes the test,
 *     or -1 if no element is found.
 * @template T,S
 */
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = 0; i < l; i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return that element.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {T} The last array element that passes the test, or null if no
 *     element is found.
 * @template T,S
 */
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return its index.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the last array element that passes the test,
 *     or -1 if no element is found.
 * @template T,S
 */
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; i--) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Whether the array contains the given object.
 * @param {goog.array.ArrayLike} arr The array to test for the presence of the
 *     element.
 * @param {*} obj The object for which to test.
 * @return {boolean} true if obj is present.
 */
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0;
};


/**
 * Whether the array is empty.
 * @param {goog.array.ArrayLike} arr The array to test.
 * @return {boolean} true if empty.
 */
goog.array.isEmpty = function(arr) {
  return arr.length == 0;
};


/**
 * Clears the array.
 * @param {goog.array.ArrayLike} arr Array or array like object to clear.
 */
goog.array.clear = function(arr) {
  // For non real arrays we don't have the magic length so we delete the
  // indices.
  if (!goog.isArray(arr)) {
    for (var i = arr.length - 1; i >= 0; i--) {
      delete arr[i];
    }
  }
  arr.length = 0;
};


/**
 * Pushes an item into an array, if it's not already in the array.
 * @param {Array.<T>} arr Array into which to insert the item.
 * @param {T} obj Value to add.
 * @template T
 */
goog.array.insert = function(arr, obj) {
  if (!goog.array.contains(arr, obj)) {
    arr.push(obj);
  }
};


/**
 * Inserts an object at the given index of the array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {*} obj The object to insert.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj);
};


/**
 * Inserts at the given index of the array, all elements of another array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {goog.array.ArrayLike} elementsToAdd The array of elements to add.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd);
};


/**
 * Inserts an object into an array before a specified object.
 * @param {Array.<T>} arr The array to modify.
 * @param {T} obj The object to insert.
 * @param {T=} opt_obj2 The object before which obj should be inserted. If obj2
 *     is omitted or not found, obj is inserted at the end of the array.
 * @template T
 */
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if (arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj);
  } else {
    goog.array.insertAt(arr, obj, i);
  }
};


/**
 * Removes the first occurrence of a particular value from an array.
 * @param {goog.array.ArrayLike} arr Array from which to remove value.
 * @param {*} obj Object to remove.
 * @return {boolean} True if an element was removed.
 */
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if ((rv = i >= 0)) {
    goog.array.removeAt(arr, i);
  }
  return rv;
};


/**
 * Removes from an array the element at index i
 * @param {goog.array.ArrayLike} arr Array or array like object from which to
 *     remove value.
 * @param {number} i The index to remove.
 * @return {boolean} True if an element was removed.
 */
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);

  // use generic form of splice
  // splice returns the removed items and if successful the length of that
  // will be 1
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1;
};


/**
 * Removes the first value that satisfies the given condition.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {boolean} True if an element was removed.
 * @template T,S
 */
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if (i >= 0) {
    goog.array.removeAt(arr, i);
    return true;
  }
  return false;
};


/**
 * Returns a new array that is the result of joining the arguments.  If arrays
 * are passed then their items are added, however, if non-arrays are passed they
 * will be added to the return array as is.
 *
 * Note that ArrayLike objects will be added as is, rather than having their
 * items added.
 *
 * goog.array.concat([1, 2], [3, 4]) -> [1, 2, 3, 4]
 * goog.array.concat(0, [1, 2]) -> [0, 1, 2]
 * goog.array.concat([1, 2], null) -> [1, 2, null]
 *
 * There is bug in all current versions of IE (6, 7 and 8) where arrays created
 * in an iframe become corrupted soon (not immediately) after the iframe is
 * destroyed. This is common if loading data via goog.net.IframeIo, for example.
 * This corruption only affects the concat method which will start throwing
 * Catastrophic Errors (#-2147418113).
 *
 * See http://endoflow.com/scratch/corrupted-arrays.html for a test case.
 *
 * Internally goog.array should use this, so that all methods will continue to
 * work on these broken array objects.
 *
 * @param {...*} var_args Items to concatenate.  Arrays will have each item
 *     added, while primitives and objects will be added as is.
 * @return {!Array} The new resultant array.
 */
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(
      goog.array.ARRAY_PROTOTYPE_, arguments);
};


/**
 * Converts an object to an array.
 * @param {goog.array.ArrayLike} object  The object to convert to an array.
 * @return {!Array} The object converted into an array. If object has a
 *     length property, every property indexed with a non-negative number
 *     less than length will be included in the result. If object does not
 *     have a length property, an empty array will be returned.
 */
goog.array.toArray = function(object) {
  var length = object.length;

  // If length is not a number the following it false. This case is kept for
  // backwards compatibility since there are callers that pass objects that are
  // not array like.
  if (length > 0) {
    var rv = new Array(length);
    for (var i = 0; i < length; i++) {
      rv[i] = object[i];
    }
    return rv;
  }
  return [];
};


/**
 * Does a shallow copy of an array.
 * @param {goog.array.ArrayLike} arr  Array or array-like object to clone.
 * @return {!Array} Clone of the input array.
 */
goog.array.clone = goog.array.toArray;


/**
 * Extends an array with another array, element, or "array like" object.
 * This function operates 'in-place', it does not create a new Array.
 *
 * Example:
 * var a = [];
 * goog.array.extend(a, [0, 1]);
 * a; // [0, 1]
 * goog.array.extend(a, 2);
 * a; // [0, 1, 2]
 *
 * @param {Array} arr1  The array to modify.
 * @param {...*} var_args The elements or arrays of elements to add to arr1.
 */
goog.array.extend = function(arr1, var_args) {
  for (var i = 1; i < arguments.length; i++) {
    var arr2 = arguments[i];
    // If we have an Array or an Arguments object we can just call push
    // directly.
    var isArrayLike;
    if (goog.isArray(arr2) ||
        // Detect Arguments. ES5 says that the [[Class]] of an Arguments object
        // is "Arguments" but only V8 and JSC/Safari gets this right. We instead
        // detect Arguments by checking for array like and presence of "callee".
        (isArrayLike = goog.isArrayLike(arr2)) &&
            // The getter for callee throws an exception in strict mode
            // according to section 10.6 in ES5 so check for presence instead.
            arr2.hasOwnProperty('callee')) {
      arr1.push.apply(arr1, arr2);

    } else if (isArrayLike) {
      // Otherwise loop over arr2 to prevent copying the object.
      var len1 = arr1.length;
      var len2 = arr2.length;
      for (var j = 0; j < len2; j++) {
        arr1[len1 + j] = arr2[j];
      }
    } else {
      arr1.push(arr2);
    }
  }
};


/**
 * Adds or removes elements from an array. This is a generic version of Array
 * splice. This means that it might work on other objects similar to arrays,
 * such as the arguments object.
 *
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {number|undefined} index The index at which to start changing the
 *     array. If not defined, treated as 0.
 * @param {number} howMany How many elements to remove (0 means no removal. A
 *     value below 0 is treated as zero and so is any other non number. Numbers
 *     are floored).
 * @param {...*} var_args Optional, additional elements to insert into the
 *     array.
 * @return {!Array} the removed elements.
 */
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);

  return goog.array.ARRAY_PROTOTYPE_.splice.apply(
      arr, goog.array.slice(arguments, 1));
};


/**
 * Returns a new array from a segment of an array. This is a generic version of
 * Array slice. This means that it might work on other objects similar to
 * arrays, such as the arguments object.
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr The array from
 * which to copy a segment.
 * @param {number} start The index of the first element to copy.
 * @param {number=} opt_end The index after the last element to copy.
 * @return {!Array.<T>} A new array containing the specified segment of the
 *     original array.
 * @template T
 */
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);

  // passing 1 arg to slice is not the same as passing 2 where the second is
  // null or undefined (in that case the second argument is treated as 0).
  // we could use slice on the arguments object and then use apply instead of
  // testing the length
  if (arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start);
  } else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end);
  }
};


/**
 * Removes all duplicates from an array (retaining only the first
 * occurrence of each array element).  This function modifies the
 * array in place and doesn't change the order of the non-duplicate items.
 *
 * For objects, duplicates are identified as having the same unique ID as
 * defined by {@link goog.getUid}.
 *
 * Runtime: N,
 * Worstcase space: 2N (no dupes)
 *
 * @param {goog.array.ArrayLike} arr The array from which to remove duplicates.
 * @param {Array=} opt_rv An optional array in which to return the results,
 *     instead of performing the removal inplace.  If specified, the original
 *     array will remain unchanged.
 */
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;

  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while (cursorRead < arr.length) {
    var current = arr[cursorRead++];

    // Prefix each type with a single character representing the type to
    // prevent conflicting keys (e.g. true and 'true').
    var key = goog.isObject(current) ?
        'o' + goog.getUid(current) :
        (typeof current).charAt(0) + current;

    if (!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current;
    }
  }
  returnArray.length = cursorInsert;
};


/**
 * Searches the specified array for the specified target using the binary
 * search algorithm.  If no opt_compareFn is specified, elements are compared
 * using <code>goog.array.defaultCompare</code>, which compares the elements
 * using the built in < and > operators.  This will produce the expected
 * behavior for homogeneous arrays of String(s) and Number(s). The array
 * specified <b>must</b> be sorted in ascending order (as defined by the
 * comparison function).  If the array is not sorted, results are undefined.
 * If the array contains multiple instances of the specified target value, any
 * of these instances may be found.
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} target The sought value.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 */
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr,
      opt_compareFn || goog.array.defaultCompare, false /* isEvaluator */,
      target);
};


/**
 * Selects an index in the specified array using the binary search algorithm.
 * The evaluator receives an element and determines whether the desired index
 * is before, at, or after it.  The evaluator must be consistent (formally,
 * goog.array.map(goog.array.map(arr, evaluator, opt_obj), goog.math.sign)
 * must be monotonically non-increasing).
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {Function} evaluator Evaluator function that receives 3 arguments
 *     (the element, the index and the array). Should return a negative number,
 *     zero, or a positive number depending on whether the desired index is
 *     before, at, or after the element passed to it.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within evaluator.
 * @return {number} Index of the leftmost element matched by the evaluator, if
 *     such exists; otherwise (-(insertion point) - 1). The insertion point is
 *     the index of the first element for which the evaluator returns negative,
 *     or arr.length if no such element exists. The return value is non-negative
 *     iff a match is found.
 */
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true /* isEvaluator */,
      undefined /* opt_target */, opt_obj);
};


/**
 * Implementation of a binary search algorithm which knows how to use both
 * comparison functions and evaluators. If an evaluator is provided, will call
 * the evaluator with the given optional data object, conforming to the
 * interface defined in binarySelect. Otherwise, if a comparison function is
 * provided, will call the comparison function against the given data object.
 *
 * This implementation purposefully does not use goog.bind or goog.partial for
 * performance reasons.
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {Function} compareFn Either an evaluator or a comparison function,
 *     as defined by binarySearch and binarySelect above.
 * @param {boolean} isEvaluator Whether the function is an evaluator or a
 *     comparison function.
 * @param {*=} opt_target If the function is a comparison function, then this is
 *     the target to binary search for.
 * @param {Object=} opt_selfObj If the function is an evaluator, this is an
  *    optional this object for the evaluator.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 * @private
 */
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target,
    opt_selfObj) {
  var left = 0;  // inclusive
  var right = arr.length;  // exclusive
  var found;
  while (left < right) {
    var middle = (left + right) >> 1;
    var compareResult;
    if (isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr);
    } else {
      compareResult = compareFn(opt_target, arr[middle]);
    }
    if (compareResult > 0) {
      left = middle + 1;
    } else {
      right = middle;
      // We are looking for the lowest index so we can't return immediately.
      found = !compareResult;
    }
  }
  // left is the index if found, or the insertion point otherwise.
  // ~left is a shorthand for -left - 1.
  return found ? left : ~left;
};


/**
 * Sorts the specified array into ascending order.  If no opt_compareFn is
 * specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s), unlike the native sort,
 * but will give unpredictable results for heterogenous lists of strings and
 * numbers with different numbers of digits.
 *
 * This sort is not guaranteed to be stable.
 *
 * Runtime: Same as <code>Array.prototype.sort</code>
 *
 * @param {Array.<T>} arr The array to be sorted.
 * @param {?function(T,T):number=} opt_compareFn Optional comparison
 *     function by which the
 *     array is to be ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @template T
 */
goog.array.sort = function(arr, opt_compareFn) {
  // TODO(arv): Update type annotation since null is not accepted.
  goog.asserts.assert(arr.length != null);

  goog.array.ARRAY_PROTOTYPE_.sort.call(
      arr, opt_compareFn || goog.array.defaultCompare);
};


/**
 * Sorts the specified array into ascending order in a stable way.  If no
 * opt_compareFn is specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s).
 *
 * Runtime: Same as <code>Array.prototype.sort</code>, plus an additional
 * O(n) overhead of copying the array twice.
 *
 * @param {Array.<T>} arr The array to be sorted.
 * @param {?function(T, T): number=} opt_compareFn Optional comparison function
 *     by which the array is to be ordered. Should take 2 arguments to compare,
 *     and return a negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @template T
 */
goog.array.stableSort = function(arr, opt_compareFn) {
  for (var i = 0; i < arr.length; i++) {
    arr[i] = {index: i, value: arr[i]};
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index;
  };
  goog.array.sort(arr, stableCompareFn);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].value;
  }
};


/**
 * Sorts an array of objects by the specified object key and compare
 * function. If no compare function is provided, the key values are
 * compared in ascending order using <code>goog.array.defaultCompare</code>.
 * This won't work for keys that get renamed by the compiler. So use
 * {'foo': 1, 'bar': 2} rather than {foo: 1, bar: 2}.
 * @param {Array.<Object>} arr An array of objects to sort.
 * @param {string} key The object key to sort by.
 * @param {Function=} opt_compareFn The function to use to compare key
 *     values.
 */
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key]);
  });
};


/**
 * Tells if the array is sorted.
 * @param {!Array.<T>} arr The array.
 * @param {?function(T,T):number=} opt_compareFn Function to compare the
 *     array elements.
 *     Should take 2 arguments to compare, and return a negative number, zero,
 *     or a positive number depending on whether the first argument is less
 *     than, equal to, or greater than the second.
 * @param {boolean=} opt_strict If true no equal elements are allowed.
 * @return {boolean} Whether the array is sorted.
 * @template T
 */
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for (var i = 1; i < arr.length; i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if (compareResult > 0 || compareResult == 0 && opt_strict) {
      return false;
    }
  }
  return true;
};


/**
 * Compares two arrays for equality. Two arrays are considered equal if they
 * have the same length and their corresponding elements are equal according to
 * the comparison function.
 *
 * @param {goog.array.ArrayLike} arr1 The first array to compare.
 * @param {goog.array.ArrayLike} arr2 The second array to compare.
 * @param {Function=} opt_equalsFn Optional comparison function.
 *     Should take 2 arguments to compare, and return true if the arguments
 *     are equal. Defaults to {@link goog.array.defaultCompareEquality} which
 *     compares the elements using the built-in '===' operator.
 * @return {boolean} Whether the two arrays are equal.
 */
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if (!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) ||
      arr1.length != arr2.length) {
    return false;
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for (var i = 0; i < l; i++) {
    if (!equalsFn(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
};


/**
 * @deprecated Use {@link goog.array.equals}.
 * @param {goog.array.ArrayLike} arr1 See {@link goog.array.equals}.
 * @param {goog.array.ArrayLike} arr2 See {@link goog.array.equals}.
 * @param {Function=} opt_equalsFn See {@link goog.array.equals}.
 * @return {boolean} See {@link goog.array.equals}.
 */
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn);
};


/**
 * 3-way array compare function.
 * @param {!goog.array.ArrayLike} arr1 The first array to compare.
 * @param {!goog.array.ArrayLike} arr2 The second array to compare.
 * @param {?function(?, ?): number=} opt_compareFn Optional comparison function
 *     by which the array is to be ordered. Should take 2 arguments to compare,
 *     and return a negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @return {number} Negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 */
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for (var i = 0; i < l; i++) {
    var result = compare(arr1[i], arr2[i]);
    if (result != 0) {
      return result;
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length);
};


/**
 * Compares its two arguments for order, using the built in < and >
 * operators.
 * @param {*} a The first object to be compared.
 * @param {*} b The second object to be compared.
 * @return {number} A negative number, zero, or a positive number as the first
 *     argument is less than, equal to, or greater than the second.
 */
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};


/**
 * Compares its two arguments for equality, using the built in === operator.
 * @param {*} a The first object to compare.
 * @param {*} b The second object to compare.
 * @return {boolean} True if the two arguments are equal, false otherwise.
 */
goog.array.defaultCompareEquality = function(a, b) {
  return a === b;
};


/**
 * Inserts a value into a sorted array. The array is not modified if the
 * value is already present.
 * @param {Array.<T>} array The array to modify.
 * @param {T} value The object to insert.
 * @param {?function(T,T):number=} opt_compareFn Optional comparison function by
 *     which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {boolean} True if an element was inserted.
 * @template T
 */
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if (index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true;
  }
  return false;
};


/**
 * Removes a value from a sorted array.
 * @param {Array} array The array to modify.
 * @param {*} value The object to remove.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {boolean} True if an element was removed.
 */
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return (index >= 0) ? goog.array.removeAt(array, index) : false;
};


/**
 * Splits an array into disjoint buckets according to a splitting function.
 * @param {Array.<T>} array The array.
 * @param {function(T,number,Array.<T>):?} sorter Function to call for every
 *     element.  This
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a valid object key (a string, number, etc), or undefined, if
 *     that object should not be placed in a bucket.
 * @return {!Object} An object, with keys being all of the unique return values
 *     of sorter, and values being arrays containing the items for
 *     which the splitter returned that key.
 * @template T
 */
goog.array.bucket = function(array, sorter) {
  var buckets = {};

  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if (goog.isDef(key)) {
      // Push the value to the right bucket, creating it if necessary.
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value);
    }
  }

  return buckets;
};


/**
 * Creates a new object built from the provided array and the key-generation
 * function.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array like object over
 *     which to iterate whose elements will be the values in the new object.
 * @param {?function(this:S, T, number, ?) : string} keyFunc The function to
 *     call for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a string that will be used as the
 *     key for the element in the new object. If the function returns the same
 *     key for more than one element, the value for that key is
 *     implementation-defined.
 * @param {S=} opt_obj  The object to be used as the value of 'this'
 *     within keyFunc.
 * @return {!Object.<T>} The new object.
 * @template T,S
 */
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element;
  });
  return ret;
};


/**
 * Returns an array consisting of the given value repeated N times.
 *
 * @param {*} value The value to repeat.
 * @param {number} n The repeat count.
 * @return {!Array} An array with the repeated value.
 */
goog.array.repeat = function(value, n) {
  var array = [];
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
};


/**
 * Returns an array consisting of every argument with all arrays
 * expanded in-place recursively.
 *
 * @param {...*} var_args The values to flatten.
 * @return {!Array} An array containing the flattened values.
 */
goog.array.flatten = function(var_args) {
  var result = [];
  for (var i = 0; i < arguments.length; i++) {
    var element = arguments[i];
    if (goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element));
    } else {
      result.push(element);
    }
  }
  return result;
};


/**
 * Rotates an array in-place. After calling this method, the element at
 * index i will be the element previously at index (i - n) %
 * array.length, for all values of i between 0 and array.length - 1,
 * inclusive.
 *
 * For example, suppose list comprises [t, a, n, k, s]. After invoking
 * rotate(array, 1) (or rotate(array, -4)), array will comprise [s, t, a, n, k].
 *
 * @param {!Array.<T>} array The array to rotate.
 * @param {number} n The amount to rotate.
 * @return {!Array.<T>} The array.
 * @template T
 */
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);

  if (array.length) {
    n %= array.length;
    if (n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n));
    } else if (n < 0) {
      goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n));
    }
  }
  return array;
};


/**
 * Creates a new array for which the element at position i is an array of the
 * ith element of the provided arrays.  The returned array will only be as long
 * as the shortest array provided; additional values are ignored.  For example,
 * the result of zipping [1, 2] and [3, 4, 5] is [[1,3], [2, 4]].
 *
 * This is similar to the zip() function in Python.  See {@link
 * http://docs.python.org/library/functions.html#zip}
 *
 * @param {...!goog.array.ArrayLike} var_args Arrays to be combined.
 * @return {!Array.<!Array>} A new array of arrays created from provided arrays.
 */
goog.array.zip = function(var_args) {
  if (!arguments.length) {
    return [];
  }
  var result = [];
  for (var i = 0; true; i++) {
    var value = [];
    for (var j = 0; j < arguments.length; j++) {
      var arr = arguments[j];
      // If i is larger than the array length, this is the shortest array.
      if (i >= arr.length) {
        return result;
      }
      value.push(arr[i]);
    }
    result.push(value);
  }
};


/**
 * Shuffles the values in the specified array using the Fisher-Yates in-place
 * shuffle (also known as the Knuth Shuffle). By default, calls Math.random()
 * and so resets the state of that random number generator. Similarly, may reset
 * the state of the any other specified random number generator.
 *
 * Runtime: O(n)
 *
 * @param {!Array} arr The array to be shuffled.
 * @param {function():number=} opt_randFn Optional random function to use for
 *     shuffling.
 *     Takes no arguments, and returns a random number on the interval [0, 1).
 *     Defaults to Math.random() using JavaScript's built-in Math library.
 */
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;

  for (var i = arr.length - 1; i > 0; i--) {
    // Choose a random array index in [0, i] (inclusive with i).
    var j = Math.floor(randFn() * (i + 1));

    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
};
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for adding, removing and setting classes.
 *
 * Note: these utilities are meant to operate on HTMLElements and
 * will not work on elements with differing interfaces (such as SVGElements).
 *
 */


goog.provide('goog.dom.classes');

goog.require('goog.array');


/**
 * Sets the entire class name of an element.
 * @param {Node} element DOM node to set class of.
 * @param {string} className Class name(s) to apply to element.
 */
goog.dom.classes.set = function(element, className) {
  element.className = className;
};


/**
 * Gets an array of class names on an element
 * @param {Node} element DOM node to get class of.
 * @return {!Array} Class names on {@code element}. Some browsers add extra
 *     properties to the array. Do not depend on any of these!
 */
goog.dom.classes.get = function(element) {
  var className = element.className;
  // Some types of elements don't have a className in IE (e.g. iframes).
  // Furthermore, in Firefox, className is not a string when the element is
  // an SVG element.
  return goog.isString(className) && className.match(/\S+/g) || [];
};


/**
 * Adds a class or classes to an element. Does not add multiples of class names.
 * @param {Node} element DOM node to add class to.
 * @param {...string} var_args Class names to add.
 * @return {boolean} Whether class was added (or all classes were added).
 */
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var expectedCount = classes.length + args.length;
  goog.dom.classes.add_(classes, args);
  element.className = classes.join(' ');
  return classes.length == expectedCount;
};


/**
 * Removes a class or classes from an element.
 * @param {Node} element DOM node to remove class from.
 * @param {...string} var_args Class name(s) to remove.
 * @return {boolean} Whether all classes in {@code var_args} were found and
 *     removed.
 */
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var newClasses = goog.dom.classes.getDifference_(classes, args);
  element.className = newClasses.join(' ');
  return newClasses.length == classes.length - args.length;
};


/**
 * Helper method for {@link goog.dom.classes.add} and
 * {@link goog.dom.classes.addRemove}. Adds one or more classes to the supplied
 * classes array.
 * @param {Array.<string>} classes All class names for the element, will be
 *     updated to have the classes supplied in {@code args} added.
 * @param {Array.<string>} args Class names to add.
 * @private
 */
goog.dom.classes.add_ = function(classes, args) {
  for (var i = 0; i < args.length; i++) {
    if (!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
    }
  }
};


/**
 * Helper method for {@link goog.dom.classes.remove} and
 * {@link goog.dom.classes.addRemove}. Calculates the difference of two arrays.
 * @param {!Array.<string>} arr1 First array.
 * @param {!Array.<string>} arr2 Second array.
 * @return {!Array.<string>} The first array without the elements of the second
 *     array.
 * @private
 */
goog.dom.classes.getDifference_ = function(arr1, arr2) {
  return goog.array.filter(arr1, function(item) {
    return !goog.array.contains(arr2, item);
  });
};


/**
 * Switches a class on an element from one to another without disturbing other
 * classes. If the fromClass isn't removed, the toClass won't be added.
 * @param {Node} element DOM node to swap classes on.
 * @param {string} fromClass Class to remove.
 * @param {string} toClass Class to add.
 * @return {boolean} Whether classes were switched.
 */
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);

  var removed = false;
  for (var i = 0; i < classes.length; i++) {
    if (classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true;
    }
  }

  if (removed) {
    classes.push(toClass);
    element.className = classes.join(' ');
  }

  return removed;
};


/**
 * Adds zero or more classes to an element and removes zero or more as a single
 * operation. Unlike calling {@link goog.dom.classes.add} and
 * {@link goog.dom.classes.remove} separately, this is more efficient as it only
 * parses the class property once.
 *
 * If a class is in both the remove and add lists, it will be added. Thus,
 * you can use this instead of {@link goog.dom.classes.swap} when you have
 * more than two class names that you want to swap.
 *
 * @param {Node} element DOM node to swap classes on.
 * @param {?(string|Array.<string>)} classesToRemove Class or classes to
 *     remove, if null no classes are removed.
 * @param {?(string|Array.<string>)} classesToAdd Class or classes to add, if
 *     null no classes are added.
 */
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if (goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove);
  } else if (goog.isArray(classesToRemove)) {
    classes = goog.dom.classes.getDifference_(classes, classesToRemove);
  }

  if (goog.isString(classesToAdd) &&
      !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd);
  } else if (goog.isArray(classesToAdd)) {
    goog.dom.classes.add_(classes, classesToAdd);
  }

  element.className = classes.join(' ');
};


/**
 * Returns true if an element has a class.
 * @param {Node} element DOM node to test.
 * @param {string} className Class name to test for.
 * @return {boolean} Whether element has the class.
 */
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className);
};


/**
 * Adds or removes a class depending on the enabled argument.
 * @param {Node} element DOM node to add or remove the class on.
 * @param {string} className Class name to add or remove.
 * @param {boolean} enabled Whether to add or remove the class (true adds,
 *     false removes).
 */
goog.dom.classes.enable = function(element, className, enabled) {
  if (enabled) {
    goog.dom.classes.add(element, className);
  } else {
    goog.dom.classes.remove(element, className);
  }
};


/**
 * Removes a class if an element has it, and adds it the element doesn't have
 * it.  Won't affect other classes on the node.
 * @param {Node} element DOM node to toggle class on.
 * @param {string} className Class to toggle.
 * @return {boolean} True if class was added, false if it was removed
 *     (in other words, whether element has the class after this function has
 *     been called).
 */
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add;
};
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating objects/maps/hashes.
 */

goog.provide('goog.object');


/**
 * Calls a function for each element in an object/map/hash.
 *
 * @param {Object.<K,V>} obj The object over which to iterate.
 * @param {function(this:T,V,?,Object.<K,V>):?} f The function to call
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the object) and the return value is ignored.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @template T,K,V
 */
goog.object.forEach = function(obj, f, opt_obj) {
  for (var key in obj) {
    f.call(opt_obj, obj[key], key, obj);
  }
};


/**
 * Calls a function for each element in an object/map/hash. If that call returns
 * true, adds the element to a new object.
 *
 * @param {Object.<K,V>} obj The object over which to iterate.
 * @param {function(this:T,K,?,Object.<K,V>):boolean} f The function to call
 *     for every element. This
 *     function takes 3 arguments (the element, the index and the object)
 *     and should return a boolean. If the return value is true the
 *     element is added to the result object. If it is false the
 *     element is not included.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {!Object.<K,V>} a new object in which only elements that passed the
 *     test are present.
 * @template T,K,V
 */
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key];
    }
  }
  return res;
};


/**
 * For every element in an object/map/hash calls a function and inserts the
 * result into a new object.
 *
 * @param {Object.<K,V>} obj The object over which to iterate.
 * @param {function(this:T,V,?,Object.<K,V>):R} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the object)
 *     and should return something. The result will be inserted
 *     into a new object.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {!Object.<T,R>} a new object with the results from f.
 * @template T,K,V,R
 */
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj);
  }
  return res;
};


/**
 * Calls a function for each element in an object/map/hash. If any
 * call returns true, returns true (without checking the rest). If
 * all calls return false, returns false.
 *
 * @param {Object.<K,V>} obj The object to check.
 * @param {function(this:T,K,?,Object.<K,V>):boolean} f The function to
 *     call for every element. This function
 *     takes 3 arguments (the element, the index and the object) and should
 *     return a boolean.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} true if any element passes the test.
 * @template T,K,V
 */
goog.object.some = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      return true;
    }
  }
  return false;
};


/**
 * Calls a function for each element in an object/map/hash. If
 * all calls return true, returns true. If any call returns false, returns
 * false at this point and does not continue to check the remaining elements.
 *
 * @param {Object.<K,V>} obj The object to check.
 * @param {?function(this:T,V,?,Object.<K,V>):boolean} f The function to
 *     call for every element. This function
 *     takes 3 arguments (the element, the index and the object) and should
 *     return a boolean.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} false if any element fails the test.
 * @template T,K,V
 */
goog.object.every = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (!f.call(opt_obj, obj[key], key, obj)) {
      return false;
    }
  }
  return true;
};


/**
 * Returns the number of key-value pairs in the object map.
 *
 * @param {Object} obj The object for which to get the number of key-value
 *     pairs.
 * @return {number} The number of key-value pairs in the object map.
 */
goog.object.getCount = function(obj) {
  // JS1.5 has __count__ but it has been deprecated so it raises a warning...
  // in other words do not use. Also __count__ only includes the fields on the
  // actual object and not in the prototype chain.
  var rv = 0;
  for (var key in obj) {
    rv++;
  }
  return rv;
};


/**
 * Returns one key from the object map, if any exists.
 * For map literals the returned key will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object} obj The object to pick a key from.
 * @return {string|undefined} The key or undefined if the object is empty.
 */
goog.object.getAnyKey = function(obj) {
  for (var key in obj) {
    return key;
  }
};


/**
 * Returns one value from the object map, if any exists.
 * For map literals the returned value will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object.<K,V>} obj The object to pick a value from.
 * @return {V|undefined} The value or undefined if the object is empty.
 * @template K,V
 */
goog.object.getAnyValue = function(obj) {
  for (var key in obj) {
    return obj[key];
  }
};


/**
 * Whether the object/hash/map contains the given object as a value.
 * An alias for goog.object.containsValue(obj, val).
 *
 * @param {Object.<K,V>} obj The object in which to look for val.
 * @param {V} val The object for which to check.
 * @return {boolean} true if val is present.
 * @template K,V
 */
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val);
};


/**
 * Returns the values of the object/map/hash.
 *
 * @param {Object.<K,V>} obj The object from which to get the values.
 * @return {!Array.<V>} The values in the object/map/hash.
 * @template K,V
 */
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = obj[key];
  }
  return res;
};


/**
 * Returns the keys of the object/map/hash.
 *
 * @param {Object} obj The object from which to get the keys.
 * @return {!Array.<string>} Array of property keys.
 */
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = key;
  }
  return res;
};


/**
 * Get a value from an object multiple levels deep.  This is useful for
 * pulling values from deeply nested objects, such as JSON responses.
 * Example usage: getValueByKeys(jsonObj, 'foo', 'entries', 3)
 *
 * @param {!Object} obj An object to get the value from.  Can be array-like.
 * @param {...(string|number|!Array.<number|string>)} var_args A number of keys
 *     (as strings, or nubmers, for array-like objects).  Can also be
 *     specified as a single array of keys.
 * @return {*} The resulting value.  If, at any point, the value for a key
 *     is undefined, returns undefined.
 */
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;

  // Start with the 2nd parameter for the variable parameters syntax.
  for (var i = isArrayLike ? 0 : 1; i < keys.length; i++) {
    obj = obj[keys[i]];
    if (!goog.isDef(obj)) {
      break;
    }
  }

  return obj;
};


/**
 * Whether the object/map/hash contains the given key.
 *
 * @param {Object} obj The object in which to look for key.
 * @param {*} key The key for which to check.
 * @return {boolean} true If the map contains the key.
 */
goog.object.containsKey = function(obj, key) {
  return key in obj;
};


/**
 * Whether the object/map/hash contains the given value. This is O(n).
 *
 * @param {Object.<K,V>} obj The object in which to look for val.
 * @param {V} val The value for which to check.
 * @return {boolean} true If the map contains the value.
 * @template K,V
 */
goog.object.containsValue = function(obj, val) {
  for (var key in obj) {
    if (obj[key] == val) {
      return true;
    }
  }
  return false;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its key.
 * @param {Object.<K,V>} obj The object to search in.
 * @param {function(this:T,V,string,Object.<K,V>):boolean} f The
 *      function to call for every element. Takes 3 arguments (the value,
 *     the key and the object) and should return a boolean.
 * @param {T=} opt_this An optional "this" context for the function.
 * @return {string|undefined} The key of an element for which the function
 *     returns true or undefined if no such element is found.
 * @template T,K,V
 */
goog.object.findKey = function(obj, f, opt_this) {
  for (var key in obj) {
    if (f.call(opt_this, obj[key], key, obj)) {
      return key;
    }
  }
  return undefined;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its value.
 * @param {Object.<K,V>} obj The object to search in.
 * @param {function(this:T,V,string,Object.<K,V>):boolean} f The function
 *     to call for every element. Takes 3 arguments (the value, the key
 *     and the object) and should return a boolean.
 * @param {T=} opt_this An optional "this" context for the function.
 * @return {V} The value of an element for which the function returns true or
 *     undefined if no such element is found.
 * @template T,K,V
 */
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key];
};


/**
 * Whether the object/map/hash is empty.
 *
 * @param {Object} obj The object to test.
 * @return {boolean} true if obj is empty.
 */
goog.object.isEmpty = function(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
};


/**
 * Removes all key value pairs from the object/map/hash.
 *
 * @param {Object} obj The object to clear.
 */
goog.object.clear = function(obj) {
  for (var i in obj) {
    delete obj[i];
  }
};


/**
 * Removes a key-value pair based on the key.
 *
 * @param {Object} obj The object from which to remove the key.
 * @param {*} key The key to remove.
 * @return {boolean} Whether an element was removed.
 */
goog.object.remove = function(obj, key) {
  var rv;
  if ((rv = key in obj)) {
    delete obj[key];
  }
  return rv;
};


/**
 * Adds a key-value pair to the object. Throws an exception if the key is
 * already in use. Use set if you want to change an existing pair.
 *
 * @param {Object.<K,V>} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {V} val The value to add.
 * @template K,V
 */
goog.object.add = function(obj, key, val) {
  if (key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val);
};


/**
 * Returns the value for the given key.
 *
 * @param {Object.<K,V>} obj The object from which to get the value.
 * @param {string} key The key for which to get the value.
 * @param {R=} opt_val The value to return if no item is found for the given
 *     key (default is undefined).
 * @return {V|R|undefined} The value for the given key.
 * @template K,V,R
 */
goog.object.get = function(obj, key, opt_val) {
  if (key in obj) {
    return obj[key];
  }
  return opt_val;
};


/**
 * Adds a key-value pair to the object/map/hash.
 *
 * @param {Object.<K,V>} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {K} value The value to add.
 * @template K,V
 */
goog.object.set = function(obj, key, value) {
  obj[key] = value;
};


/**
 * Adds a key-value pair to the object/map/hash if it doesn't exist yet.
 *
 * @param {Object.<K,V>} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {V} value The value to add if the key wasn't present.
 * @return {V} The value of the entry at the end of the function.
 * @template K,V
 */
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : (obj[key] = value);
};


/**
 * Does a flat clone of the object.
 *
 * @param {Object.<K,V>} obj Object to clone.
 * @return {!Object.<K,V>} Clone of the input object.
 * @template K,V
 */
goog.object.clone = function(obj) {
  // We cannot use the prototype trick because a lot of methods depend on where
  // the actual key is set.

  var res = {};
  for (var key in obj) {
    res[key] = obj[key];
  }
  return res;
  // We could also use goog.mixin but I wanted this to be independent from that.
};


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.object.unsafeClone</code> does not detect reference loops. Objects
 * that refer to themselves will cause infinite recursion.
 *
 * <code>goog.object.unsafeClone</code> is unaware of unique identifiers, and
 * copies UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 */
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * Returns a new object in which all the keys and values are interchanged
 * (keys become values and values become keys). If multiple keys map to the
 * same value, the chosen transposed value is implementation-dependent.
 *
 * @param {Object} obj The object to transpose.
 * @return {!Object} The transposed object.
 */
goog.object.transpose = function(obj) {
  var transposed = {};
  for (var key in obj) {
    transposed[obj[key]] = key;
  }
  return transposed;
};


/**
 * The names of the fields that are defined on Object.prototype.
 * @type {Array.<string>}
 * @private
 */
goog.object.PROTOTYPE_FIELDS_ = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


/**
 * Extends an object with another object.
 * This operates 'in-place'; it does not create a new Object.
 *
 * Example:
 * var o = {};
 * goog.object.extend(o, {a: 0, b: 1});
 * o; // {a: 0, b: 1}
 * goog.object.extend(o, {c: 2});
 * o; // {a: 0, b: 1, c: 2}
 *
 * @param {Object} target  The object to modify.
 * @param {...Object} var_args The objects from which values will be copied.
 */
goog.object.extend = function(target, var_args) {
  var key, source;
  for (var i = 1; i < arguments.length; i++) {
    source = arguments[i];
    for (key in source) {
      target[key] = source[key];
    }

    // For IE the for-in-loop does not contain any properties that are not
    // enumerable on the prototype object (for example isPrototypeOf from
    // Object.prototype) and it will also not include 'replace' on objects that
    // extend String and change 'replace' (not that it is common for anyone to
    // extend anything except Object).

    for (var j = 0; j < goog.object.PROTOTYPE_FIELDS_.length; j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
};


/**
 * Creates a new object built from the key-value pairs provided as arguments.
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise even arguments are used as
 *     the property names and odd arguments are used as the property values.
 * @return {!Object} The new object.
 * @throws {Error} If there are uneven number of arguments or there is only one
 *     non array argument.
 */
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0]);
  }

  if (argLength % 2) {
    throw Error('Uneven number of arguments');
  }

  var rv = {};
  for (var i = 0; i < argLength; i += 2) {
    rv[arguments[i]] = arguments[i + 1];
  }
  return rv;
};


/**
 * Creates a new object where the property names come from the arguments but
 * the value is always set to true
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise the arguments are used
 *     as the property names.
 * @return {!Object} The new object.
 */
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0]);
  }

  var rv = {};
  for (var i = 0; i < argLength; i++) {
    rv[arguments[i]] = true;
  }
  return rv;
};


/**
 * Creates an immutable view of the underlying object, if the browser
 * supports immutable objects.
 *
 * In default mode, writes to this view will fail silently. In strict mode,
 * they will throw an error.
 *
 * @param {!Object.<K,V>} obj An object.
 * @return {!Object.<K,V>} An immutable view of that object, or the
 *     original object if this browser does not support immutables.
 * @template K,V
 */
goog.object.createImmutableView = function(obj) {
  var result = obj;
  if (Object.isFrozen && !Object.isFrozen(obj)) {
    result = Object.create(obj);
    Object.freeze(result);
  }
  return result;
};


/**
 * @param {!Object} obj An object.
 * @return {boolean} Whether this is an immutable view of the object.
 */
goog.object.isImmutableView = function(obj) {
  return !!Object.isFrozen && Object.isFrozen(obj);
};
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines the goog.dom.TagName enum.  This enumerates
 * all HTML tag names specified in either the the W3C HTML 4.01 index of
 * elements or the HTML5 draft specification.
 *
 * References:
 * http://www.w3.org/TR/html401/index/elements.html
 * http://dev.w3.org/html5/spec/section-index.html
 *
 */
goog.provide('goog.dom.TagName');


/**
 * Enum of all html tag names specified by the W3C HTML4.01 and HTML5
 * specifications.
 * @enum {string}
 */
goog.dom.TagName = {
  A: 'A',
  ABBR: 'ABBR',
  ACRONYM: 'ACRONYM',
  ADDRESS: 'ADDRESS',
  APPLET: 'APPLET',
  AREA: 'AREA',
  ARTICLE: 'ARTICLE',
  ASIDE: 'ASIDE',
  AUDIO: 'AUDIO',
  B: 'B',
  BASE: 'BASE',
  BASEFONT: 'BASEFONT',
  BDI: 'BDI',
  BDO: 'BDO',
  BIG: 'BIG',
  BLOCKQUOTE: 'BLOCKQUOTE',
  BODY: 'BODY',
  BR: 'BR',
  BUTTON: 'BUTTON',
  CANVAS: 'CANVAS',
  CAPTION: 'CAPTION',
  CENTER: 'CENTER',
  CITE: 'CITE',
  CODE: 'CODE',
  COL: 'COL',
  COLGROUP: 'COLGROUP',
  COMMAND: 'COMMAND',
  DATA: 'DATA',
  DATALIST: 'DATALIST',
  DD: 'DD',
  DEL: 'DEL',
  DETAILS: 'DETAILS',
  DFN: 'DFN',
  DIALOG: 'DIALOG',
  DIR: 'DIR',
  DIV: 'DIV',
  DL: 'DL',
  DT: 'DT',
  EM: 'EM',
  EMBED: 'EMBED',
  FIELDSET: 'FIELDSET',
  FIGCAPTION: 'FIGCAPTION',
  FIGURE: 'FIGURE',
  FONT: 'FONT',
  FOOTER: 'FOOTER',
  FORM: 'FORM',
  FRAME: 'FRAME',
  FRAMESET: 'FRAMESET',
  H1: 'H1',
  H2: 'H2',
  H3: 'H3',
  H4: 'H4',
  H5: 'H5',
  H6: 'H6',
  HEAD: 'HEAD',
  HEADER: 'HEADER',
  HGROUP: 'HGROUP',
  HR: 'HR',
  HTML: 'HTML',
  I: 'I',
  IFRAME: 'IFRAME',
  IMG: 'IMG',
  INPUT: 'INPUT',
  INS: 'INS',
  ISINDEX: 'ISINDEX',
  KBD: 'KBD',
  KEYGEN: 'KEYGEN',
  LABEL: 'LABEL',
  LEGEND: 'LEGEND',
  LI: 'LI',
  LINK: 'LINK',
  MAP: 'MAP',
  MARK: 'MARK',
  MATH: 'MATH',
  MENU: 'MENU',
  META: 'META',
  METER: 'METER',
  NAV: 'NAV',
  NOFRAMES: 'NOFRAMES',
  NOSCRIPT: 'NOSCRIPT',
  OBJECT: 'OBJECT',
  OL: 'OL',
  OPTGROUP: 'OPTGROUP',
  OPTION: 'OPTION',
  OUTPUT: 'OUTPUT',
  P: 'P',
  PARAM: 'PARAM',
  PRE: 'PRE',
  PROGRESS: 'PROGRESS',
  Q: 'Q',
  RP: 'RP',
  RT: 'RT',
  RUBY: 'RUBY',
  S: 'S',
  SAMP: 'SAMP',
  SCRIPT: 'SCRIPT',
  SECTION: 'SECTION',
  SELECT: 'SELECT',
  SMALL: 'SMALL',
  SOURCE: 'SOURCE',
  SPAN: 'SPAN',
  STRIKE: 'STRIKE',
  STRONG: 'STRONG',
  STYLE: 'STYLE',
  SUB: 'SUB',
  SUMMARY: 'SUMMARY',
  SUP: 'SUP',
  SVG: 'SVG',
  TABLE: 'TABLE',
  TBODY: 'TBODY',
  TD: 'TD',
  TEXTAREA: 'TEXTAREA',
  TFOOT: 'TFOOT',
  TH: 'TH',
  THEAD: 'THEAD',
  TIME: 'TIME',
  TITLE: 'TITLE',
  TR: 'TR',
  TRACK: 'TRACK',
  TT: 'TT',
  U: 'U',
  UL: 'UL',
  VAR: 'VAR',
  VIDEO: 'VIDEO',
  WBR: 'WBR'
};
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Rendering engine detection.
 * @see <a href="http://www.useragentstring.com/">User agent strings</a>
 * For information on the browser brand (such as Safari versus Chrome), see
 * goog.userAgent.product.
 * @see ../demos/useragent.html
 */

goog.provide('goog.userAgent');

goog.require('goog.string');


/**
 * @define {boolean} Whether we know at compile-time that the browser is IE.
 */
goog.userAgent.ASSUME_IE = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is GECKO.
 */
goog.userAgent.ASSUME_GECKO = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is WEBKIT.
 */
goog.userAgent.ASSUME_WEBKIT = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is a
 *     mobile device running WebKit e.g. iPhone or Android.
 */
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is OPERA.
 */
goog.userAgent.ASSUME_OPERA = false;


/**
 * @define {boolean} Whether the {@code goog.userAgent.isVersion} function will
 *     return true for any version.
 */
goog.userAgent.ASSUME_ANY_VERSION = false;


/**
 * Whether we know the browser engine at compile-time.
 * @type {boolean}
 * @private
 */
goog.userAgent.BROWSER_KNOWN_ =
    goog.userAgent.ASSUME_IE ||
    goog.userAgent.ASSUME_GECKO ||
    goog.userAgent.ASSUME_MOBILE_WEBKIT ||
    goog.userAgent.ASSUME_WEBKIT ||
    goog.userAgent.ASSUME_OPERA;


/**
 * Returns the userAgent string for the current browser.
 * Some user agents (I'm thinking of you, Gears WorkerPool) do not expose a
 * navigator object off the global scope.  In that case we return null.
 *
 * @return {?string} The userAgent string or null if there is none.
 */
goog.userAgent.getUserAgentString = function() {
  return goog.global['navigator'] ? goog.global['navigator'].userAgent : null;
};


/**
 * @return {Object} The native navigator object.
 */
goog.userAgent.getNavigator = function() {
  // Need a local navigator reference instead of using the global one,
  // to avoid the rare case where they reference different objects.
  // (in a WorkerPool, for example).
  return goog.global['navigator'];
};


/**
 * Initializer for goog.userAgent.
 *
 * This is a named function so that it can be stripped via the jscompiler
 * option for stripping types.
 * @private
 */
goog.userAgent.init_ = function() {
  /**
   * Whether the user agent string denotes Opera.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedOpera_ = false;

  /**
   * Whether the user agent string denotes Internet Explorer. This includes
   * other browsers using Trident as its rendering engine. For example AOL
   * and Netscape 8
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedIe_ = false;

  /**
   * Whether the user agent string denotes WebKit. WebKit is the rendering
   * engine that Safari, Android and others use.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedWebkit_ = false;

  /**
   * Whether the user agent string denotes a mobile device.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedMobile_ = false;

  /**
   * Whether the user agent string denotes Gecko. Gecko is the rendering
   * engine used by Mozilla, Mozilla Firefox, Camino and many more.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedGecko_ = false;

  var ua;
  if (!goog.userAgent.BROWSER_KNOWN_ &&
      (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf('Opera') == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ &&
        ua.indexOf('MSIE') != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ &&
        ua.indexOf('WebKit') != -1;
    // WebKit also gives navigator.product string equal to 'Gecko'.
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ &&
        ua.indexOf('Mobile') != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ &&
        !goog.userAgent.detectedWebkit_ && navigator.product == 'Gecko';
  }
};


if (!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_();
}


/**
 * Whether the user agent is Opera.
 * @type {boolean}
 */
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;


/**
 * Whether the user agent is Internet Explorer. This includes other browsers
 * using Trident as its rendering engine. For example AOL and Netscape 8
 * @type {boolean}
 */
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;


/**
 * Whether the user agent is Gecko. Gecko is the rendering engine used by
 * Mozilla, Mozilla Firefox, Camino and many more.
 * @type {boolean}
 */
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_GECKO :
    goog.userAgent.detectedGecko_;


/**
 * Whether the user agent is WebKit. WebKit is the rendering engine that
 * Safari, Android and others use.
 * @type {boolean}
 */
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT :
    goog.userAgent.detectedWebkit_;


/**
 * Whether the user agent is running on a mobile device.
 * @type {boolean}
 */
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT ||
                        goog.userAgent.detectedMobile_;


/**
 * Used while transitioning code to use WEBKIT instead.
 * @type {boolean}
 * @deprecated Use {@link goog.userAgent.product.SAFARI} instead.
 * TODO(nicksantos): Delete this from goog.userAgent.
 */
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;


/**
 * @return {string} the platform (operating system) the user agent is running
 *     on. Default to empty string because navigator.platform may not be defined
 *     (on Rhino, for example).
 * @private
 */
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || '';
};


/**
 * The platform (operating system) the user agent is running on. Default to
 * empty string because navigator.platform may not be defined (on Rhino, for
 * example).
 * @type {string}
 */
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();


/**
 * @define {boolean} Whether the user agent is running on a Macintosh operating
 *     system.
 */
goog.userAgent.ASSUME_MAC = false;


/**
 * @define {boolean} Whether the user agent is running on a Windows operating
 *     system.
 */
goog.userAgent.ASSUME_WINDOWS = false;


/**
 * @define {boolean} Whether the user agent is running on a Linux operating
 *     system.
 */
goog.userAgent.ASSUME_LINUX = false;


/**
 * @define {boolean} Whether the user agent is running on a X11 windowing
 *     system.
 */
goog.userAgent.ASSUME_X11 = false;


/**
 * @type {boolean}
 * @private
 */
goog.userAgent.PLATFORM_KNOWN_ =
    goog.userAgent.ASSUME_MAC ||
    goog.userAgent.ASSUME_WINDOWS ||
    goog.userAgent.ASSUME_LINUX ||
    goog.userAgent.ASSUME_X11;


/**
 * Initialize the goog.userAgent constants that define which platform the user
 * agent is running on.
 * @private
 */
goog.userAgent.initPlatform_ = function() {
  /**
   * Whether the user agent is running on a Macintosh operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM,
      'Mac');

  /**
   * Whether the user agent is running on a Windows operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedWindows_ = goog.string.contains(
      goog.userAgent.PLATFORM, 'Win');

  /**
   * Whether the user agent is running on a Linux operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM,
      'Linux');

  /**
   * Whether the user agent is running on a X11 windowing system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() &&
      goog.string.contains(goog.userAgent.getNavigator()['appVersion'] || '',
          'X11');
};


if (!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_();
}


/**
 * Whether the user agent is running on a Macintosh operating system.
 * @type {boolean}
 */
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;


/**
 * Whether the user agent is running on a Windows operating system.
 * @type {boolean}
 */
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;


/**
 * Whether the user agent is running on a Linux operating system.
 * @type {boolean}
 */
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;


/**
 * Whether the user agent is running on a X11 windowing system.
 * @type {boolean}
 */
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;


/**
 * @return {string} The string that describes the version number of the user
 *     agent.
 * @private
 */
goog.userAgent.determineVersion_ = function() {
  // All browsers have different ways to detect the version and they all have
  // different naming schemes.

  // version is a string rather than a number because it may contain 'b', 'a',
  // and so on.
  var version = '', re;

  if (goog.userAgent.OPERA && goog.global['opera']) {
    var operaVersion = goog.global['opera'].version;
    version = typeof operaVersion == 'function' ? operaVersion() : operaVersion;
  } else {
    if (goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/;
    } else if (goog.userAgent.IE) {
      re = /MSIE\s+([^\);]+)(\)|;)/;
    } else if (goog.userAgent.WEBKIT) {
      // WebKit/125.4
      re = /WebKit\/(\S+)/;
    }
    if (re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : '';
    }
  }
  if (goog.userAgent.IE) {
    // IE9 can be in document mode 9 but be reporting an inconsistent user agent
    // version.  If it is identifying as a version lower than 9 we take the
    // documentMode as the version instead.  IE8 has similar behavior.
    // It is recommended to set the X-UA-Compatible header to ensure that IE9
    // uses documentMode 9.
    var docMode = goog.userAgent.getDocumentMode_();
    if (docMode > parseFloat(version)) {
      return String(docMode);
    }
  }
  return version;
};


/**
 * @return {number|undefined} Returns the document mode (for testing).
 * @private
 */
goog.userAgent.getDocumentMode_ = function() {
  // NOTE(user): goog.userAgent may be used in context where there is no DOM.
  var doc = goog.global['document'];
  return doc ? doc['documentMode'] : undefined;
};


/**
 * The version of the user agent. This is a string because it might contain
 * 'b' (as in beta) as well as multiple dots.
 * @type {string}
 */
goog.userAgent.VERSION = goog.userAgent.determineVersion_();


/**
 * Compares two version numbers.
 *
 * @param {string} v1 Version of first item.
 * @param {string} v2 Version of second item.
 *
 * @return {number}  1 if first argument is higher
 *                   0 if arguments are equal
 *                  -1 if second argument is higher.
 * @deprecated Use goog.string.compareVersions.
 */
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2);
};


/**
 * Cache for {@link goog.userAgent.isVersion}. Calls to compareVersions are
 * surprisingly expensive and as a browsers version number is unlikely to change
 * during a session we cache the results.
 * @type {Object}
 * @private
 */
goog.userAgent.isVersionCache_ = {};


/**
 * Whether the user agent version is higher or the same as the given version.
 * NOTE: When checking the version numbers for Firefox and Safari, be sure to
 * use the engine's version, not the browser's version number.  For example,
 * Firefox 3.0 corresponds to Gecko 1.9 and Safari 3.0 to Webkit 522.11.
 * Opera and Internet Explorer versions match the product release number.<br>
 * @see <a href="http://en.wikipedia.org/wiki/Safari_version_history">
 *     Webkit</a>
 * @see <a href="http://en.wikipedia.org/wiki/Gecko_engine">Gecko</a>
 *
 * @param {string|number} version The version to check.
 * @return {boolean} Whether the user agent version is higher or the same as
 *     the given version.
 */
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION ||
      goog.userAgent.isVersionCache_[version] ||
      (goog.userAgent.isVersionCache_[version] =
          goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0);
};


/**
 * Whether the IE effective document mode is higher or the same as the given
 * document mode version.
 * NOTE: Only for IE, return false for another browser.
 *
 * @param {number} documentMode The document mode version to check.
 * @return {boolean} Whether the IE effective document mode is higher or the
 *     same as the given version.
 */
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.IE && goog.userAgent.DOCUMENT_MODE >= documentMode;
};


/**
 * For IE version < 7, documentMode is undefined, so attempt to use the
 * CSS1Compat property to see if we are in standards mode. If we are in
 * standards mode, treat the browser version as the document mode. Otherwise,
 * IE is emulating version 5.
 * @type {number|undefined}
 * @const
 */
goog.userAgent.DOCUMENT_MODE = (function() {
  var doc = goog.global['document'];
  if (!doc || !goog.userAgent.IE) {
    return undefined;
  }
  var mode = goog.userAgent.getDocumentMode_();
  return mode || (doc['compatMode'] == 'CSS1Compat' ?
      parseInt(goog.userAgent.VERSION, 10) : 5);
})();
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A utility class for representing two-dimensional sizes.
 */


goog.provide('goog.math.Size');



/**
 * Class for representing sizes consisting of a width and height. Undefined
 * width and height support is deprecated and results in compiler warning.
 * @param {number} width Width.
 * @param {number} height Height.
 * @constructor
 */
goog.math.Size = function(width, height) {
  /**
   * Width
   * @type {number}
   */
  this.width = width;

  /**
   * Height
   * @type {number}
   */
  this.height = height;
};


/**
 * Compares sizes for equality.
 * @param {goog.math.Size} a A Size.
 * @param {goog.math.Size} b A Size.
 * @return {boolean} True iff the sizes have equal widths and equal
 *     heights, or if both are null.
 */
goog.math.Size.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.width == b.width && a.height == b.height;
};


/**
 * @return {!goog.math.Size} A new copy of the Size.
 */
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height);
};


if (goog.DEBUG) {
  /**
   * Returns a nice string representing size.
   * @return {string} In the form (50 x 73).
   * @override
   */
  goog.math.Size.prototype.toString = function() {
    return '(' + this.width + ' x ' + this.height + ')';
  };
}


/**
 * @return {number} The longer of the two dimensions in the size.
 */
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height);
};


/**
 * @return {number} The shorter of the two dimensions in the size.
 */
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height);
};


/**
 * @return {number} The area of the size (width * height).
 */
goog.math.Size.prototype.area = function() {
  return this.width * this.height;
};


/**
 * @return {number} The perimeter of the size (width + height) * 2.
 */
goog.math.Size.prototype.perimeter = function() {
  return (this.width + this.height) * 2;
};


/**
 * @return {number} The ratio of the size's width to its height.
 */
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height;
};


/**
 * @return {boolean} True if the size has zero area, false if both dimensions
 *     are non-zero numbers.
 */
goog.math.Size.prototype.isEmpty = function() {
  return !this.area();
};


/**
 * Clamps the width and height parameters upward to integer values.
 * @return {!goog.math.Size} This size with ceil'd components.
 */
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this;
};


/**
 * @param {!goog.math.Size} target The target size.
 * @return {boolean} True if this Size is the same size or smaller than the
 *     target size in both dimensions.
 */
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height;
};


/**
 * Clamps the width and height parameters downward to integer values.
 * @return {!goog.math.Size} This size with floored components.
 */
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this;
};


/**
 * Rounds the width and height parameters to integer values.
 * @return {!goog.math.Size} This size with rounded components.
 */
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this;
};


/**
 * Scales the size uniformly by a factor.
 * @param {number} s The scale factor.
 * @return {!goog.math.Size} This Size object after scaling.
 */
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this;
};


/**
 * Uniformly scales the size to fit inside the dimensions of a given size. The
 * original aspect ratio will be preserved.
 *
 * This function assumes that both Sizes contain strictly positive dimensions.
 * @param {!goog.math.Size} target The target size.
 * @return {!goog.math.Size} This Size object, after optional scaling.
 */
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ?
      target.width / this.width :
      target.height / this.height;

  return this.scale(s);
};
// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Browser capability checks for the dom package.
 *
 */


goog.provide('goog.dom.BrowserFeature');

goog.require('goog.userAgent');


/**
 * Enum of browser capabilities.
 * @enum {boolean}
 */
goog.dom.BrowserFeature = {
  /**
   * Whether attributes 'name' and 'type' can be added to an element after it's
   * created. False in Internet Explorer prior to version 9.
   */
  CAN_ADD_NAME_OR_TYPE_ATTRIBUTES: !goog.userAgent.IE ||
      goog.userAgent.isDocumentMode(9),

  /**
   * Whether we can use element.children to access an element's Element
   * children. Available since Gecko 1.9.1, IE 9. (IE<9 also includes comment
   * nodes in the collection.)
   */
  CAN_USE_CHILDREN_ATTRIBUTE: !goog.userAgent.GECKO && !goog.userAgent.IE ||
      goog.userAgent.IE && goog.userAgent.isDocumentMode(9) ||
      goog.userAgent.GECKO && goog.userAgent.isVersion('1.9.1'),

  /**
   * Opera, Safari 3, and Internet Explorer 9 all support innerText but they
   * include text nodes in script and style tags. Not document-mode-dependent.
   */
  CAN_USE_INNER_TEXT: goog.userAgent.IE && !goog.userAgent.isVersion('9'),

  /**
   * MSIE, Opera, and Safari>=4 support element.parentElement to access an
   * element's parent if it is an Element.
   */
  CAN_USE_PARENT_ELEMENT_PROPERTY: goog.userAgent.IE || goog.userAgent.OPERA ||
      goog.userAgent.WEBKIT,

  /**
   * Whether NoScope elements need a scoped element written before them in
   * innerHTML.
   * MSDN: http://msdn.microsoft.com/en-us/library/ms533897(VS.85).aspx#1
   */
  INNER_HTML_NEEDS_SCOPED_ELEMENT: goog.userAgent.IE
};
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Additional mathematical functions.
 */

goog.provide('goog.math');

goog.require('goog.array');


/**
 * Returns a random integer greater than or equal to 0 and less than {@code a}.
 * @param {number} a  The upper bound for the random integer (exclusive).
 * @return {number} A random integer N such that 0 <= N < a.
 */
goog.math.randomInt = function(a) {
  return Math.floor(Math.random() * a);
};


/**
 * Returns a random number greater than or equal to {@code a} and less than
 * {@code b}.
 * @param {number} a  The lower bound for the random number (inclusive).
 * @param {number} b  The upper bound for the random number (exclusive).
 * @return {number} A random number N such that a <= N < b.
 */
goog.math.uniformRandom = function(a, b) {
  return a + Math.random() * (b - a);
};


/**
 * Takes a number and clamps it to within the provided bounds.
 * @param {number} value The input number.
 * @param {number} min The minimum value to return.
 * @param {number} max The maximum value to return.
 * @return {number} The input number if it is within bounds, or the nearest
 *     number within the bounds.
 */
goog.math.clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max);
};


/**
 * The % operator in JavaScript returns the remainder of a / b, but differs from
 * some other languages in that the result will have the same sign as the
 * dividend. For example, -1 % 8 == -1, whereas in some other languages
 * (such as Python) the result would be 7. This function emulates the more
 * correct modulo behavior, which is useful for certain applications such as
 * calculating an offset index in a circular list.
 *
 * @param {number} a The dividend.
 * @param {number} b The divisor.
 * @return {number} a % b where the result is between 0 and b (either 0 <= x < b
 *     or b < x <= 0, depending on the sign of b).
 */
goog.math.modulo = function(a, b) {
  var r = a % b;
  // If r and b differ in sign, add b to wrap the result to the correct sign.
  return (r * b < 0) ? r + b : r;
};


/**
 * Performs linear interpolation between values a and b. Returns the value
 * between a and b proportional to x (when x is between 0 and 1. When x is
 * outside this range, the return value is a linear extrapolation).
 * @param {number} a A number.
 * @param {number} b A number.
 * @param {number} x The proportion between a and b.
 * @return {number} The interpolated value between a and b.
 */
goog.math.lerp = function(a, b, x) {
  return a + x * (b - a);
};


/**
 * Tests whether the two values are equal to each other, within a certain
 * tolerance to adjust for floating pount errors.
 * @param {number} a A number.
 * @param {number} b A number.
 * @param {number=} opt_tolerance Optional tolerance range. Defaults
 *     to 0.000001. If specified, should be greater than 0.
 * @return {boolean} Whether {@code a} and {@code b} are nearly equal.
 */
goog.math.nearlyEquals = function(a, b, opt_tolerance) {
  return Math.abs(a - b) <= (opt_tolerance || 0.000001);
};


/**
 * Standardizes an angle to be in range [0-360). Negative angles become
 * positive, and values greater than 360 are returned modulo 360.
 * @param {number} angle Angle in degrees.
 * @return {number} Standardized angle.
 */
goog.math.standardAngle = function(angle) {
  return goog.math.modulo(angle, 360);
};


/**
 * Converts degrees to radians.
 * @param {number} angleDegrees Angle in degrees.
 * @return {number} Angle in radians.
 */
goog.math.toRadians = function(angleDegrees) {
  return angleDegrees * Math.PI / 180;
};


/**
 * Converts radians to degrees.
 * @param {number} angleRadians Angle in radians.
 * @return {number} Angle in degrees.
 */
goog.math.toDegrees = function(angleRadians) {
  return angleRadians * 180 / Math.PI;
};


/**
 * For a given angle and radius, finds the X portion of the offset.
 * @param {number} degrees Angle in degrees (zero points in +X direction).
 * @param {number} radius Radius.
 * @return {number} The x-distance for the angle and radius.
 */
goog.math.angleDx = function(degrees, radius) {
  return radius * Math.cos(goog.math.toRadians(degrees));
};


/**
 * For a given angle and radius, finds the Y portion of the offset.
 * @param {number} degrees Angle in degrees (zero points in +X direction).
 * @param {number} radius Radius.
 * @return {number} The y-distance for the angle and radius.
 */
goog.math.angleDy = function(degrees, radius) {
  return radius * Math.sin(goog.math.toRadians(degrees));
};


/**
 * Computes the angle between two points (x1,y1) and (x2,y2).
 * Angle zero points in the +X direction, 90 degrees points in the +Y
 * direction (down) and from there we grow clockwise towards 360 degrees.
 * @param {number} x1 x of first point.
 * @param {number} y1 y of first point.
 * @param {number} x2 x of second point.
 * @param {number} y2 y of second point.
 * @return {number} Standardized angle in degrees of the vector from
 *     x1,y1 to x2,y2.
 */
goog.math.angle = function(x1, y1, x2, y2) {
  return goog.math.standardAngle(goog.math.toDegrees(Math.atan2(y2 - y1,
                                                                x2 - x1)));
};


/**
 * Computes the difference between startAngle and endAngle (angles in degrees).
 * @param {number} startAngle  Start angle in degrees.
 * @param {number} endAngle  End angle in degrees.
 * @return {number} The number of degrees that when added to
 *     startAngle will result in endAngle. Positive numbers mean that the
 *     direction is clockwise. Negative numbers indicate a counter-clockwise
 *     direction.
 *     The shortest route (clockwise vs counter-clockwise) between the angles
 *     is used.
 *     When the difference is 180 degrees, the function returns 180 (not -180)
 *     angleDifference(30, 40) is 10, and angleDifference(40, 30) is -10.
 *     angleDifference(350, 10) is 20, and angleDifference(10, 350) is -20.
 */
goog.math.angleDifference = function(startAngle, endAngle) {
  var d = goog.math.standardAngle(endAngle) -
          goog.math.standardAngle(startAngle);
  if (d > 180) {
    d = d - 360;
  } else if (d <= -180) {
    d = 360 + d;
  }
  return d;
};


/**
 * Returns the sign of a number as per the "sign" or "signum" function.
 * @param {number} x The number to take the sign of.
 * @return {number} -1 when negative, 1 when positive, 0 when 0.
 */
goog.math.sign = function(x) {
  return x == 0 ? 0 : (x < 0 ? -1 : 1);
};


/**
 * JavaScript implementation of Longest Common Subsequence problem.
 * http://en.wikipedia.org/wiki/Longest_common_subsequence
 *
 * Returns the longest possible array that is subarray of both of given arrays.
 *
 * @param {Array.<Object>} array1 First array of objects.
 * @param {Array.<Object>} array2 Second array of objects.
 * @param {Function=} opt_compareFn Function that acts as a custom comparator
 *     for the array ojects. Function should return true if objects are equal,
 *     otherwise false.
 * @param {Function=} opt_collectorFn Function used to decide what to return
 *     as a result subsequence. It accepts 2 arguments: index of common element
 *     in the first array and index in the second. The default function returns
 *     element from the first array.
 * @return {Array.<Object>} A list of objects that are common to both arrays
 *     such that there is no common subsequence with size greater than the
 *     length of the list.
 */
goog.math.longestCommonSubsequence = function(
    array1, array2, opt_compareFn, opt_collectorFn) {

  var compare = opt_compareFn || function(a, b) {
    return a == b;
  };

  var collect = opt_collectorFn || function(i1, i2) {
    return array1[i1];
  };

  var length1 = array1.length;
  var length2 = array2.length;

  var arr = [];
  for (var i = 0; i < length1 + 1; i++) {
    arr[i] = [];
    arr[i][0] = 0;
  }

  for (var j = 0; j < length2 + 1; j++) {
    arr[0][j] = 0;
  }

  for (i = 1; i <= length1; i++) {
    for (j = 1; j <= length1; j++) {
      if (compare(array1[i - 1], array2[j - 1])) {
        arr[i][j] = arr[i - 1][j - 1] + 1;
      } else {
        arr[i][j] = Math.max(arr[i - 1][j], arr[i][j - 1]);
      }
    }
  }

  // Backtracking
  var result = [];
  var i = length1, j = length2;
  while (i > 0 && j > 0) {
    if (compare(array1[i - 1], array2[j - 1])) {
      result.unshift(collect(i - 1, j - 1));
      i--;
      j--;
    } else {
      if (arr[i - 1][j] > arr[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
  }

  return result;
};


/**
 * Returns the sum of the arguments.
 * @param {...number} var_args Numbers to add.
 * @return {number} The sum of the arguments (0 if no arguments were provided,
 *     {@code NaN} if any of the arguments is not a valid number).
 */
goog.math.sum = function(var_args) {
  return /** @type {number} */ (goog.array.reduce(arguments,
      function(sum, value) {
        return sum + value;
      }, 0));
};


/**
 * Returns the arithmetic mean of the arguments.
 * @param {...number} var_args Numbers to average.
 * @return {number} The average of the arguments ({@code NaN} if no arguments
 *     were provided or any of the arguments is not a valid number).
 */
goog.math.average = function(var_args) {
  return goog.math.sum.apply(null, arguments) / arguments.length;
};


/**
 * Returns the sample standard deviation of the arguments.  For a definition of
 * sample standard deviation, see e.g.
 * http://en.wikipedia.org/wiki/Standard_deviation
 * @param {...number} var_args Number samples to analyze.
 * @return {number} The sample standard deviation of the arguments (0 if fewer
 *     than two samples were provided, or {@code NaN} if any of the samples is
 *     not a valid number).
 */
goog.math.standardDeviation = function(var_args) {
  var sampleSize = arguments.length;
  if (sampleSize < 2) {
    return 0;
  }

  var mean = goog.math.average.apply(null, arguments);
  var variance = goog.math.sum.apply(null, goog.array.map(arguments,
      function(val) {
        return Math.pow(val - mean, 2);
      })) / (sampleSize - 1);

  return Math.sqrt(variance);
};


/**
 * Returns whether the supplied number represents an integer, i.e. that is has
 * no fractional component.  No range-checking is performed on the number.
 * @param {number} num The number to test.
 * @return {boolean} Whether {@code num} is an integer.
 */
goog.math.isInt = function(num) {
  return isFinite(num) && num % 1 == 0;
};


/**
 * Returns whether the supplied number is finite and not NaN.
 * @param {number} num The number to test.
 * @return {boolean} Whether {@code num} is a finite number.
 */
goog.math.isFiniteNumber = function(num) {
  return isFinite(num) && !isNaN(num);
};
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A utility class for representing two-dimensional positions.
 */


goog.provide('goog.math.Coordinate');

goog.require('goog.math');



/**
 * Class for representing coordinates and positions.
 * @param {number=} opt_x Left, defaults to 0.
 * @param {number=} opt_y Top, defaults to 0.
 * @constructor
 */
goog.math.Coordinate = function(opt_x, opt_y) {
  /**
   * X-value
   * @type {number}
   */
  this.x = goog.isDef(opt_x) ? opt_x : 0;

  /**
   * Y-value
   * @type {number}
   */
  this.y = goog.isDef(opt_y) ? opt_y : 0;
};


/**
 * Returns a new copy of the coordinate.
 * @return {!goog.math.Coordinate} A clone of this coordinate.
 */
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y);
};


if (goog.DEBUG) {
  /**
   * Returns a nice string representing the coordinate.
   * @return {string} In the form (50, 73).
   * @override
   */
  goog.math.Coordinate.prototype.toString = function() {
    return '(' + this.x + ', ' + this.y + ')';
  };
}


/**
 * Compares coordinates for equality.
 * @param {goog.math.Coordinate} a A Coordinate.
 * @param {goog.math.Coordinate} b A Coordinate.
 * @return {boolean} True iff the coordinates are equal, or if both are null.
 */
goog.math.Coordinate.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.x == b.x && a.y == b.y;
};


/**
 * Returns the distance between two coordinates.
 * @param {!goog.math.Coordinate} a A Coordinate.
 * @param {!goog.math.Coordinate} b A Coordinate.
 * @return {number} The distance between {@code a} and {@code b}.
 */
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};


/**
 * Returns the magnitude of a coordinate.
 * @param {!goog.math.Coordinate} a A Coordinate.
 * @return {number} The distance between the origin and {@code a}.
 */
goog.math.Coordinate.magnitude = function(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
};


/**
 * Returns the angle from the origin to a coordinate.
 * @param {!goog.math.Coordinate} a A Coordinate.
 * @return {number} The angle, in degrees, clockwise from the positive X
 *     axis to {@code a}.
 */
goog.math.Coordinate.azimuth = function(a) {
  return goog.math.angle(0, 0, a.x, a.y);
};


/**
 * Returns the squared distance between two coordinates. Squared distances can
 * be used for comparisons when the actual value is not required.
 *
 * Performance note: eliminating the square root is an optimization often used
 * in lower-level languages, but the speed difference is not nearly as
 * pronounced in JavaScript (only a few percent.)
 *
 * @param {!goog.math.Coordinate} a A Coordinate.
 * @param {!goog.math.Coordinate} b A Coordinate.
 * @return {number} The squared distance between {@code a} and {@code b}.
 */
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy;
};


/**
 * Returns the difference between two coordinates as a new
 * goog.math.Coordinate.
 * @param {!goog.math.Coordinate} a A Coordinate.
 * @param {!goog.math.Coordinate} b A Coordinate.
 * @return {!goog.math.Coordinate} A Coordinate representing the difference
 *     between {@code a} and {@code b}.
 */
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y);
};


/**
 * Returns the sum of two coordinates as a new goog.math.Coordinate.
 * @param {!goog.math.Coordinate} a A Coordinate.
 * @param {!goog.math.Coordinate} b A Coordinate.
 * @return {!goog.math.Coordinate} A Coordinate representing the sum of the two
 *     coordinates.
 */
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y);
};
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating the browser's Document Object Model
 * Inspiration taken *heavily* from mochikit (http://mochikit.com/).
 *
 * You can use {@link goog.dom.DomHelper} to create new dom helpers that refer
 * to a different document object.  This is useful if you are working with
 * frames or multiple windows.
 *
 */


// TODO(arv): Rename/refactor getTextContent and getRawTextContent. The problem
// is that getTextContent should mimic the DOM3 textContent. We should add a
// getInnerText (or getText) which tries to return the visible text, innerText.


goog.provide('goog.dom');
goog.provide('goog.dom.DomHelper');
goog.provide('goog.dom.NodeType');

goog.require('goog.array');
goog.require('goog.dom.BrowserFeature');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Size');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.userAgent');


/**
 * @define {boolean} Whether we know at compile time that the browser is in
 * quirks mode.
 */
goog.dom.ASSUME_QUIRKS_MODE = false;


/**
 * @define {boolean} Whether we know at compile time that the browser is in
 * standards compliance mode.
 */
goog.dom.ASSUME_STANDARDS_MODE = false;


/**
 * Whether we know the compatibility mode at compile time.
 * @type {boolean}
 * @private
 */
goog.dom.COMPAT_MODE_KNOWN_ =
    goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;


/**
 * Enumeration for DOM node types (for reference)
 * @enum {number}
 */
goog.dom.NodeType = {
  ELEMENT: 1,
  ATTRIBUTE: 2,
  TEXT: 3,
  CDATA_SECTION: 4,
  ENTITY_REFERENCE: 5,
  ENTITY: 6,
  PROCESSING_INSTRUCTION: 7,
  COMMENT: 8,
  DOCUMENT: 9,
  DOCUMENT_TYPE: 10,
  DOCUMENT_FRAGMENT: 11,
  NOTATION: 12
};


/**
 * Gets the DomHelper object for the document where the element resides.
 * @param {(Node|Window)=} opt_element If present, gets the DomHelper for this
 *     element.
 * @return {!goog.dom.DomHelper} The DomHelper.
 */
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ?
      new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) :
      (goog.dom.defaultDomHelper_ ||
          (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper()));
};


/**
 * Cached default DOM helper.
 * @type {goog.dom.DomHelper}
 * @private
 */
goog.dom.defaultDomHelper_;


/**
 * Gets the document object being used by the dom library.
 * @return {!Document} Document object.
 */
goog.dom.getDocument = function() {
  return document;
};


/**
 * Alias for getElementById. If a DOM node is passed in then we just return
 * that.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 */
goog.dom.getElement = function(element) {
  return goog.isString(element) ?
      document.getElementById(element) : element;
};


/**
 * Alias for getElement.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 * @deprecated Use {@link goog.dom.getElement} instead.
 */
goog.dom.$ = goog.dom.getElement;


/**
 * Looks up elements by both tag and class name, using browser native functions
 * ({@code querySelectorAll}, {@code getElementsByTagName} or
 * {@code getElementsByClassName}) where possible. This function
 * is a useful, if limited, way of collecting a list of DOM elements
 * with certain characteristics.  {@code goog.dom.query} offers a
 * more powerful and general solution which allows matching on CSS3
 * selector expressions, but at increased cost in code size. If all you
 * need is particular tags belonging to a single class, this function
 * is fast and sleek.
 *
 * @see {goog.dom.query}
 *
 * @param {?string=} opt_tag Element tag name.
 * @param {?string=} opt_class Optional class name.
 * @param {(Document|Element)=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 */
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class,
                                                opt_el);
};


/**
 * Returns an array of all the elements with the provided className.
 * @see {goog.dom.query}
 * @param {string} className the name of the class to look for.
 * @param {(Document|Element)=} opt_el Optional element to look in.
 * @return { {length: number} } The items found with the class name provided.
 */
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if (goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll('.' + className);
  } else if (parent.getElementsByClassName) {
    return parent.getElementsByClassName(className);
  }
  return goog.dom.getElementsByTagNameAndClass_(
      document, '*', className, opt_el);
};


/**
 * Returns the first element with the provided className.
 * @see {goog.dom.query}
 * @param {string} className the name of the class to look for.
 * @param {Element|Document=} opt_el Optional element to look in.
 * @return {Element} The first item with the class name provided.
 */
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if (goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector('.' + className);
  } else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0];
  }
  return retVal || null;
};


/**
 * Prefer the standardized (http://www.w3.org/TR/selectors-api/), native and
 * fast W3C Selectors API.
 * @param {!(Element|Document)} parent The parent document object.
 * @return {boolean} whether or not we can use parent.querySelector* APIs.
 * @private
 */
goog.dom.canUseQuerySelector_ = function(parent) {
  return !!(parent.querySelectorAll && parent.querySelector);
};


/**
 * Helper for {@code getElementsByTagNameAndClass}.
 * @param {!Document} doc The document to get the elements in.
 * @param {?string=} opt_tag Element tag name.
 * @param {?string=} opt_class Optional class name.
 * @param {(Document|Element)=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 * @private
 */
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class,
                                                  opt_el) {
  var parent = opt_el || doc;
  var tagName = (opt_tag && opt_tag != '*') ? opt_tag.toUpperCase() : '';

  if (goog.dom.canUseQuerySelector_(parent) &&
      (tagName || opt_class)) {
    var query = tagName + (opt_class ? '.' + opt_class : '');
    return parent.querySelectorAll(query);
  }

  // Use the native getElementsByClassName if available, under the assumption
  // that even when the tag name is specified, there will be fewer elements to
  // filter through when going by class than by tag name
  if (opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);

    if (tagName) {
      var arrayLike = {};
      var len = 0;

      // Filter for specific tags if requested.
      for (var i = 0, el; el = els[i]; i++) {
        if (tagName == el.nodeName) {
          arrayLike[len++] = el;
        }
      }
      arrayLike.length = len;

      return arrayLike;
    } else {
      return els;
    }
  }

  var els = parent.getElementsByTagName(tagName || '*');

  if (opt_class) {
    var arrayLike = {};
    var len = 0;
    for (var i = 0, el; el = els[i]; i++) {
      var className = el.className;
      // Check if className has a split function since SVG className does not.
      if (typeof className.split == 'function' &&
          goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el;
      }
    }
    arrayLike.length = len;
    return arrayLike;
  } else {
    return els;
  }
};


/**
 * Alias for {@code getElementsByTagNameAndClass}.
 * @param {?string=} opt_tag Element tag name.
 * @param {?string=} opt_class Optional class name.
 * @param {Element=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 * @deprecated Use {@link goog.dom.getElementsByTagNameAndClass} instead.
 */
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;


/**
 * Sets multiple properties on a node.
 * @param {Element} element DOM node to set properties on.
 * @param {Object} properties Hash of property:value pairs.
 */
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if (key == 'style') {
      element.style.cssText = val;
    } else if (key == 'class') {
      element.className = val;
    } else if (key == 'for') {
      element.htmlFor = val;
    } else if (key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
      element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val);
    } else if (goog.string.startsWith(key, 'aria-') ||
        goog.string.startsWith(key, 'data-')) {
      element.setAttribute(key, val);
    } else {
      element[key] = val;
    }
  });
};


/**
 * Map of attributes that should be set using
 * element.setAttribute(key, val) instead of element[key] = val.  Used
 * by goog.dom.setProperties.
 *
 * @type {Object}
 * @private
 */
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {
  'cellpadding': 'cellPadding',
  'cellspacing': 'cellSpacing',
  'colspan': 'colSpan',
  'frameborder': 'frameBorder',
  'height': 'height',
  'maxlength': 'maxLength',
  'role': 'role',
  'rowspan': 'rowSpan',
  'type': 'type',
  'usemap': 'useMap',
  'valign': 'vAlign',
  'width': 'width'
};


/**
 * Gets the dimensions of the viewport.
 *
 * Gecko Standards mode:
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * win.innerWidth     Width of viewport including scrollbar.
 * body.clientWidth   Width of body element.
 *
 * docEl.clientHeight Height of viewport excluding scrollbar.
 * win.innerHeight    Height of viewport including scrollbar.
 * body.clientHeight  Height of document.
 *
 * Gecko Backwards compatible mode:
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * win.innerWidth     Width of viewport including scrollbar.
 * body.clientWidth   Width of viewport excluding scrollbar.
 *
 * docEl.clientHeight Height of document.
 * win.innerHeight    Height of viewport including scrollbar.
 * body.clientHeight  Height of viewport excluding scrollbar.
 *
 * IE6/7 Standards mode:
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * win.innerWidth     Undefined.
 * body.clientWidth   Width of body element.
 *
 * docEl.clientHeight Height of viewport excluding scrollbar.
 * win.innerHeight    Undefined.
 * body.clientHeight  Height of document element.
 *
 * IE5 + IE6/7 Backwards compatible mode:
 * docEl.clientWidth  0.
 * win.innerWidth     Undefined.
 * body.clientWidth   Width of viewport excluding scrollbar.
 *
 * docEl.clientHeight 0.
 * win.innerHeight    Undefined.
 * body.clientHeight  Height of viewport excluding scrollbar.
 *
 * Opera 9 Standards and backwards compatible mode:
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * win.innerWidth     Width of viewport including scrollbar.
 * body.clientWidth   Width of viewport excluding scrollbar.
 *
 * docEl.clientHeight Height of document.
 * win.innerHeight    Height of viewport including scrollbar.
 * body.clientHeight  Height of viewport excluding scrollbar.
 *
 * WebKit:
 * Safari 2
 * docEl.clientHeight Same as scrollHeight.
 * docEl.clientWidth  Same as innerWidth.
 * win.innerWidth     Width of viewport excluding scrollbar.
 * win.innerHeight    Height of the viewport including scrollbar.
 * frame.innerHeight  Height of the viewport exluding scrollbar.
 *
 * Safari 3 (tested in 522)
 *
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * docEl.clientHeight Height of viewport excluding scrollbar in strict mode.
 * body.clientHeight  Height of viewport excluding scrollbar in quirks mode.
 *
 * @param {Window=} opt_window Optional window element to test.
 * @return {!goog.math.Size} Object with values 'width' and 'height'.
 */
goog.dom.getViewportSize = function(opt_window) {
  // TODO(arv): This should not take an argument
  return goog.dom.getViewportSize_(opt_window || window);
};


/**
 * Helper for {@code getViewportSize}.
 * @param {Window} win The window to get the view port size for.
 * @return {!goog.math.Size} Object with values 'width' and 'height'.
 * @private
 */
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight);
};


/**
 * Calculates the height of the document.
 *
 * @return {number} The height of the current document.
 */
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window);
};


/**
 * Calculates the height of the document of the given window.
 *
 * Function code copied from the opensocial gadget api:
 *   gadgets.window.adjustHeight(opt_height)
 *
 * @private
 * @param {Window} win The window whose document height to retrieve.
 * @return {number} The height of the document of the given window.
 */
goog.dom.getDocumentHeight_ = function(win) {
  // NOTE(eae): This method will return the window size rather than the document
  // size in webkit quirks mode.
  var doc = win.document;
  var height = 0;

  if (doc) {
    // Calculating inner content height is hard and different between
    // browsers rendering in Strict vs. Quirks mode.  We use a combination of
    // three properties within document.body and document.documentElement:
    // - scrollHeight
    // - offsetHeight
    // - clientHeight
    // These values differ significantly between browsers and rendering modes.
    // But there are patterns.  It just takes a lot of time and persistence
    // to figure out.

    // Get the height of the viewport
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if (goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      // In Strict mode:
      // The inner content height is contained in either:
      //    document.documentElement.scrollHeight
      //    document.documentElement.offsetHeight
      // Based on studying the values output by different browsers,
      // use the value that's NOT equal to the viewport height found above.
      height = docEl.scrollHeight != vh ?
          docEl.scrollHeight : docEl.offsetHeight;
    } else {
      // In Quirks mode:
      // documentElement.clientHeight is equal to documentElement.offsetHeight
      // except in IE.  In most browsers, document.documentElement can be used
      // to calculate the inner content height.
      // However, in other browsers (e.g. IE), document.body must be used
      // instead.  How do we know which one to use?
      // If document.documentElement.clientHeight does NOT equal
      // document.documentElement.offsetHeight, then use document.body.
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if (docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight;
      }

      // Detect whether the inner content height is bigger or smaller
      // than the bounding box (viewport).  If bigger, take the larger
      // value.  If smaller, take the smaller value.
      if (sh > vh) {
        // Content is larger
        height = sh > oh ? sh : oh;
      } else {
        // Content is smaller
        height = sh < oh ? sh : oh;
      }
    }
  }

  return height;
};


/**
 * Gets the page scroll distance as a coordinate object.
 *
 * @param {Window=} opt_window Optional window element to test.
 * @return {!goog.math.Coordinate} Object with values 'x' and 'y'.
 * @deprecated Use {@link goog.dom.getDocumentScroll} instead.
 */
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll();
};


/**
 * Gets the document scroll distance as a coordinate object.
 *
 * @return {!goog.math.Coordinate} Object with values 'x' and 'y'.
 */
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document);
};


/**
 * Helper for {@code getDocumentScroll}.
 *
 * @param {!Document} doc The document to get the scroll for.
 * @return {!goog.math.Coordinate} Object with values 'x' and 'y'.
 * @private
 */
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft,
      win.pageYOffset || el.scrollTop);
};


/**
 * Gets the document scroll element.
 * @return {Element} Scrolling element.
 */
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document);
};


/**
 * Helper for {@code getDocumentScrollElement}.
 * @param {!Document} doc The document to get the scroll element for.
 * @return {Element} Scrolling element.
 * @private
 */
goog.dom.getDocumentScrollElement_ = function(doc) {
  // Safari (2 and 3) needs body.scrollLeft in both quirks mode and strict mode.
  return !goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ?
      doc.documentElement : doc.body;
};


/**
 * Gets the window object associated with the given document.
 *
 * @param {Document=} opt_doc  Document object to get window for.
 * @return {!Window} The window associated with the given document.
 */
goog.dom.getWindow = function(opt_doc) {
  // TODO(arv): This should not take an argument.
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window;
};


/**
 * Helper for {@code getWindow}.
 *
 * @param {!Document} doc  Document object to get window for.
 * @return {!Window} The window associated with the given document.
 * @private
 */
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView;
};


/**
 * Returns a dom node with a set of attributes.  This function accepts varargs
 * for subsequent nodes to be added.  Subsequent nodes will be added to the
 * first node as childNodes.
 *
 * So:
 * <code>createDom('div', null, createDom('p'), createDom('p'));</code>
 * would return a div with two child paragraphs
 *
 * @param {string} tagName Tag to create.
 * @param {(Object|Array.<string>|string)=} opt_attributes If object, then a map
 *     of name-value pairs for attributes. If a string, then this is the
 *     className of the new element. If an array, the elements will be joined
 *     together as the className of the new element.
 * @param {...(Object|string|Array|NodeList)} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or NodeList,i
 *     its elements will be added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 */
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments);
};


/**
 * Helper for {@code createDom}.
 * @param {!Document} doc The document to create the DOM in.
 * @param {!Arguments} args Argument object passed from the callers. See
 *     {@code goog.dom.createDom} for details.
 * @return {!Element} Reference to a DOM node.
 * @private
 */
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];

  // Internet Explorer is dumb: http://msdn.microsoft.com/workshop/author/
  //                            dhtml/reference/properties/name_2.asp
  // Also does not allow setting of 'type' attribute on 'input' or 'button'.
  if (!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes &&
      (attributes.name || attributes.type)) {
    var tagNameArr = ['<', tagName];
    if (attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name),
                      '"');
    }
    if (attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type),
                      '"');

      // Clone attributes map to remove 'type' without mutating the input.
      var clone = {};
      goog.object.extend(clone, attributes);

      // JSCompiler can't see how goog.object.extend added this property,
      // because it was essentially added by reflection.
      // So it needs to be quoted.
      delete clone['type'];

      attributes = clone;
    }
    tagNameArr.push('>');
    tagName = tagNameArr.join('');
  }

  var element = doc.createElement(tagName);

  if (attributes) {
    if (goog.isString(attributes)) {
      element.className = attributes;
    } else if (goog.isArray(attributes)) {
      goog.dom.classes.add.apply(null, [element].concat(attributes));
    } else {
      goog.dom.setProperties(element, attributes);
    }
  }

  if (args.length > 2) {
    goog.dom.append_(doc, element, args, 2);
  }

  return element;
};


/**
 * Appends a node with text or other nodes.
 * @param {!Document} doc The document to create new nodes in.
 * @param {!Node} parent The node to append nodes to.
 * @param {!Arguments} args The values to add. See {@code goog.dom.append}.
 * @param {number} startIndex The index of the array to start from.
 * @private
 */
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    // TODO(user): More coercion, ala MochiKit?
    if (child) {
      parent.appendChild(goog.isString(child) ?
          doc.createTextNode(child) : child);
    }
  }

  for (var i = startIndex; i < args.length; i++) {
    var arg = args[i];
    // TODO(attila): Fix isArrayLike to return false for a text node.
    if (goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      // If the argument is a node list, not a real array, use a clone,
      // because forEach can't be used to mutate a NodeList.
      goog.array.forEach(goog.dom.isNodeList(arg) ?
          goog.array.toArray(arg) : arg,
          childHandler);
    } else {
      childHandler(arg);
    }
  }
};


/**
 * Alias for {@code createDom}.
 * @param {string} tagName Tag to create.
 * @param {(string|Object)=} opt_attributes If object, then a map of name-value
 *     pairs for attributes. If a string, then this is the className of the new
 *     element.
 * @param {...(Object|string|Array|NodeList)} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array, its
 *     children will be added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 * @deprecated Use {@link goog.dom.createDom} instead.
 */
goog.dom.$dom = goog.dom.createDom;


/**
 * Creates a new element.
 * @param {string} name Tag name.
 * @return {!Element} The new element.
 */
goog.dom.createElement = function(name) {
  return document.createElement(name);
};


/**
 * Creates a new text node.
 * @param {string} content Content.
 * @return {!Text} The new text node.
 */
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content);
};


/**
 * Create a table.
 * @param {number} rows The number of rows in the table.  Must be >= 1.
 * @param {number} columns The number of columns in the table.  Must be >= 1.
 * @param {boolean=} opt_fillWithNbsp If true, fills table entries with nsbps.
 * @return {!Element} The created table.
 */
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp);
};


/**
 * Create a table.
 * @param {!Document} doc Document object to use to create the table.
 * @param {number} rows The number of rows in the table.  Must be >= 1.
 * @param {number} columns The number of columns in the table.  Must be >= 1.
 * @param {boolean} fillWithNbsp If true, fills table entries with nsbps.
 * @return {!Element} The created table.
 * @private
 */
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ['<tr>'];
  for (var i = 0; i < columns; i++) {
    rowHtml.push(fillWithNbsp ? '<td>&nbsp;</td>' : '<td></td>');
  }
  rowHtml.push('</tr>');
  rowHtml = rowHtml.join('');
  var totalHtml = ['<table>'];
  for (i = 0; i < rows; i++) {
    totalHtml.push(rowHtml);
  }
  totalHtml.push('</table>');

  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join('');
  return /** @type {!Element} */ (elem.removeChild(elem.firstChild));
};


/**
 * Converts an HTML string into a document fragment. The string must be
 * sanitized in order to avoid cross-site scripting. For example
 * {@code goog.dom.htmlToDocumentFragment('&lt;img src=x onerror=alert(0)&gt;')}
 * triggers an alert in all browsers, even if the returned document fragment
 * is thrown away immediately.
 *
 * @param {string} htmlString The HTML string to convert.
 * @return {!Node} The resulting document fragment.
 */
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString);
};


/**
 * Helper for {@code htmlToDocumentFragment}.
 *
 * @param {!Document} doc The document.
 * @param {string} htmlString The HTML string to convert.
 * @return {!Node} The resulting document fragment.
 * @private
 */
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement('div');
  if (goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = '<br>' + htmlString;
    tempDiv.removeChild(tempDiv.firstChild);
  } else {
    tempDiv.innerHTML = htmlString;
  }
  if (tempDiv.childNodes.length == 1) {
    return /** @type {!Node} */ (tempDiv.removeChild(tempDiv.firstChild));
  } else {
    var fragment = doc.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    return fragment;
  }
};


/**
 * Returns the compatMode of the document.
 * @return {string} The result is either CSS1Compat or BackCompat.
 * @deprecated use goog.dom.isCss1CompatMode instead.
 */
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? 'CSS1Compat' : 'BackCompat';
};


/**
 * Returns true if the browser is in "CSS1-compatible" (standards-compliant)
 * mode, false otherwise.
 * @return {boolean} True if in CSS1-compatible mode.
 */
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document);
};


/**
 * Returns true if the browser is in "CSS1-compatible" (standards-compliant)
 * mode, false otherwise.
 * @param {Document} doc The document to check.
 * @return {boolean} True if in CSS1-compatible mode.
 * @private
 */
goog.dom.isCss1CompatMode_ = function(doc) {
  if (goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE;
  }

  return doc.compatMode == 'CSS1Compat';
};


/**
 * Determines if the given node can contain children, intended to be used for
 * HTML generation.
 *
 * IE natively supports node.canHaveChildren but has inconsistent behavior.
 * Prior to IE8 the base tag allows children and in IE9 all nodes return true
 * for canHaveChildren.
 *
 * In practice all non-IE browsers allow you to add children to any node, but
 * the behavior is inconsistent:
 *
 * <pre>
 *   var a = document.createElement('br');
 *   a.appendChild(document.createTextNode('foo'));
 *   a.appendChild(document.createTextNode('bar'));
 *   console.log(a.childNodes.length);  // 2
 *   console.log(a.innerHTML);  // Chrome: "", IE9: "foobar", FF3.5: "foobar"
 * </pre>
 *
 * TODO(user): Rename shouldAllowChildren() ?
 *
 * @param {Node} node The node to check.
 * @return {boolean} Whether the node can contain children.
 */
goog.dom.canHaveChildren = function(node) {
  if (node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false;
  }
  switch (node.tagName) {
    case goog.dom.TagName.APPLET:
    case goog.dom.TagName.AREA:
    case goog.dom.TagName.BASE:
    case goog.dom.TagName.BR:
    case goog.dom.TagName.COL:
    case goog.dom.TagName.COMMAND:
    case goog.dom.TagName.EMBED:
    case goog.dom.TagName.FRAME:
    case goog.dom.TagName.HR:
    case goog.dom.TagName.IMG:
    case goog.dom.TagName.INPUT:
    case goog.dom.TagName.IFRAME:
    case goog.dom.TagName.ISINDEX:
    case goog.dom.TagName.KEYGEN:
    case goog.dom.TagName.LINK:
    case goog.dom.TagName.NOFRAMES:
    case goog.dom.TagName.NOSCRIPT:
    case goog.dom.TagName.META:
    case goog.dom.TagName.OBJECT:
    case goog.dom.TagName.PARAM:
    case goog.dom.TagName.SCRIPT:
    case goog.dom.TagName.SOURCE:
    case goog.dom.TagName.STYLE:
    case goog.dom.TagName.TRACK:
    case goog.dom.TagName.WBR:
      return false;
  }
  return true;
};


/**
 * Appends a child to a node.
 * @param {Node} parent Parent.
 * @param {Node} child Child.
 */
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child);
};


/**
 * Appends a node with text or other nodes.
 * @param {!Node} parent The node to append nodes to.
 * @param {...goog.dom.Appendable} var_args The things to append to the node.
 *     If this is a Node it is appended as is.
 *     If this is a string then a text node is appended.
 *     If this is an array like object then fields 0 to length - 1 are appended.
 */
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1);
};


/**
 * Removes all the child nodes on a DOM node.
 * @param {Node} node Node to remove children from.
 */
goog.dom.removeChildren = function(node) {
  // Note: Iterations over live collections can be slow, this is the fastest
  // we could find. The double parenthesis are used to prevent JsCompiler and
  // strict warnings.
  var child;
  while ((child = node.firstChild)) {
    node.removeChild(child);
  }
};


/**
 * Inserts a new node before an existing reference node (i.e. as the previous
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert before.
 */
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if (refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode);
  }
};


/**
 * Inserts a new node after an existing reference node (i.e. as the next
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert after.
 */
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if (refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
  }
};


/**
 * Insert a child at a given index. If index is larger than the number of child
 * nodes that the parent currently has, the node is inserted as the last child
 * node.
 * @param {Element} parent The element into which to insert the child.
 * @param {Node} child The element to insert.
 * @param {number} index The index at which to insert the new child node. Must
 *     not be negative.
 */
goog.dom.insertChildAt = function(parent, child, index) {
  // Note that if the second argument is null, insertBefore
  // will append the child at the end of the list of children.
  parent.insertBefore(child, parent.childNodes[index] || null);
};


/**
 * Removes a node from its parent.
 * @param {Node} node The node to remove.
 * @return {Node} The node removed if removed; else, null.
 */
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null;
};


/**
 * Replaces a node in the DOM tree. Will do nothing if {@code oldNode} has no
 * parent.
 * @param {Node} newNode Node to insert.
 * @param {Node} oldNode Node to replace.
 */
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if (parent) {
    parent.replaceChild(newNode, oldNode);
  }
};


/**
 * Flattens an element. That is, removes it and replace it with its children.
 * Does nothing if the element is not in the document.
 * @param {Element} element The element to flatten.
 * @return {Element|undefined} The original element, detached from the document
 *     tree, sans children; or undefined, if the element was not in the document
 *     to begin with.
 */
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if (parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    // Use IE DOM method (supported by Opera too) if available
    if (element.removeNode) {
      return /** @type {Element} */ (element.removeNode(false));
    } else {
      // Move all children of the original node up one level.
      while ((child = element.firstChild)) {
        parent.insertBefore(child, element);
      }

      // Detach the original element.
      return /** @type {Element} */ (goog.dom.removeNode(element));
    }
  }
};


/**
 * Returns an array containing just the element children of the given element.
 * @param {Element} element The element whose element children we want.
 * @return {!(Array|NodeList)} An array or array-like list of just the element
 *     children of the given element.
 */
goog.dom.getChildren = function(element) {
  // We check if the children attribute is supported for child elements
  // since IE8 misuses the attribute by also including comments.
  if (goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE &&
      element.children != undefined) {
    return element.children;
  }
  // Fall back to manually filtering the element's child nodes.
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT;
  });
};


/**
 * Returns the first child node that is an element.
 * @param {Node} node The node to get the first child element of.
 * @return {Element} The first child node of {@code node} that is an element.
 */
goog.dom.getFirstElementChild = function(node) {
  if (node.firstElementChild != undefined) {
    return /** @type {Element} */(node).firstElementChild;
  }
  return goog.dom.getNextElementNode_(node.firstChild, true);
};


/**
 * Returns the last child node that is an element.
 * @param {Node} node The node to get the last child element of.
 * @return {Element} The last child node of {@code node} that is an element.
 */
goog.dom.getLastElementChild = function(node) {
  if (node.lastElementChild != undefined) {
    return /** @type {Element} */(node).lastElementChild;
  }
  return goog.dom.getNextElementNode_(node.lastChild, false);
};


/**
 * Returns the first next sibling that is an element.
 * @param {Node} node The node to get the next sibling element of.
 * @return {Element} The next sibling of {@code node} that is an element.
 */
goog.dom.getNextElementSibling = function(node) {
  if (node.nextElementSibling != undefined) {
    return /** @type {Element} */(node).nextElementSibling;
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true);
};


/**
 * Returns the first previous sibling that is an element.
 * @param {Node} node The node to get the previous sibling element of.
 * @return {Element} The first previous sibling of {@code node} that is
 *     an element.
 */
goog.dom.getPreviousElementSibling = function(node) {
  if (node.previousElementSibling != undefined) {
    return /** @type {Element} */(node).previousElementSibling;
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false);
};


/**
 * Returns the first node that is an element in the specified direction,
 * starting with {@code node}.
 * @param {Node} node The node to get the next element from.
 * @param {boolean} forward Whether to look forwards or backwards.
 * @return {Element} The first element.
 * @private
 */
goog.dom.getNextElementNode_ = function(node, forward) {
  while (node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling;
  }

  return /** @type {Element} */ (node);
};


/**
 * Returns the next node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The next node in the DOM tree, or null if this was the last
 *     node.
 */
goog.dom.getNextNode = function(node) {
  if (!node) {
    return null;
  }

  if (node.firstChild) {
    return node.firstChild;
  }

  while (node && !node.nextSibling) {
    node = node.parentNode;
  }

  return node ? node.nextSibling : null;
};


/**
 * Returns the previous node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The previous node in the DOM tree, or null if this was the
 *     first node.
 */
goog.dom.getPreviousNode = function(node) {
  if (!node) {
    return null;
  }

  if (!node.previousSibling) {
    return node.parentNode;
  }

  node = node.previousSibling;
  while (node && node.lastChild) {
    node = node.lastChild;
  }

  return node;
};


/**
 * Whether the object looks like a DOM node.
 * @param {*} obj The object being tested for node likeness.
 * @return {boolean} Whether the object looks like a DOM node.
 */
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0;
};


/**
 * Whether the object looks like an Element.
 * @param {*} obj The object being tested for Element likeness.
 * @return {boolean} Whether the object looks like an Element.
 */
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT;
};


/**
 * Returns true if the specified value is a Window object. This includes the
 * global window for HTML pages, and iframe windows.
 * @param {*} obj Variable to test.
 * @return {boolean} Whether the variable is a window.
 */
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj['window'] == obj;
};


/**
 * Returns an element's parent, if it's an Element.
 * @param {Element} element The DOM element.
 * @return {Element} The parent, or null if not an Element.
 */
goog.dom.getParentElement = function(element) {
  if (goog.dom.BrowserFeature.CAN_USE_PARENT_ELEMENT_PROPERTY) {
    return element.parentElement;
  }
  var parent = element.parentNode;
  return goog.dom.isElement(parent) ? (/** @type {!Element} */ parent) : null;
};


/**
 * Whether a node contains another node.
 * @param {Node} parent The node that should contain the other node.
 * @param {Node} descendant The node to test presence of.
 * @return {boolean} Whether the parent node contains the descendent node.
 */
goog.dom.contains = function(parent, descendant) {
  // We use browser specific methods for this if available since it is faster
  // that way.

  // IE DOM
  if (parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant);
  }

  // W3C DOM Level 3
  if (typeof parent.compareDocumentPosition != 'undefined') {
    return parent == descendant ||
        Boolean(parent.compareDocumentPosition(descendant) & 16);
  }

  // W3C DOM Level 1
  while (descendant && parent != descendant) {
    descendant = descendant.parentNode;
  }
  return descendant == parent;
};


/**
 * Compares the document order of two nodes, returning 0 if they are the same
 * node, a negative number if node1 is before node2, and a positive number if
 * node2 is before node1.  Note that we compare the order the tags appear in the
 * document so in the tree <b><i>text</i></b> the B node is considered to be
 * before the I node.
 *
 * @param {Node} node1 The first node to compare.
 * @param {Node} node2 The second node to compare.
 * @return {number} 0 if the nodes are the same node, a negative number if node1
 *     is before node2, and a positive number if node2 is before node1.
 */
goog.dom.compareNodeOrder = function(node1, node2) {
  // Fall out quickly for equality.
  if (node1 == node2) {
    return 0;
  }

  // Use compareDocumentPosition where available
  if (node1.compareDocumentPosition) {
    // 4 is the bitmask for FOLLOWS.
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1;
  }

  // Special case for document nodes on IE 7 and 8.
  if (goog.userAgent.IE && !goog.userAgent.isDocumentMode(9)) {
    if (node1.nodeType == goog.dom.NodeType.DOCUMENT) {
      return -1;
    }
    if (node2.nodeType == goog.dom.NodeType.DOCUMENT) {
      return 1;
    }
  }

  // Process in IE using sourceIndex - we check to see if the first node has
  // a source index or if its parent has one.
  if ('sourceIndex' in node1 ||
      (node1.parentNode && 'sourceIndex' in node1.parentNode)) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;

    if (isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex;
    } else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;

      if (parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2);
      }

      if (!isElement1 && goog.dom.contains(parent1, node2)) {
        return -1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2);
      }


      if (!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1);
      }

      return (isElement1 ? node1.sourceIndex : parent1.sourceIndex) -
             (isElement2 ? node2.sourceIndex : parent2.sourceIndex);
    }
  }

  // For Safari, we compare ranges.
  var doc = goog.dom.getOwnerDocument(node1);

  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);

  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);

  return range1.compareBoundaryPoints(goog.global['Range'].START_TO_END,
      range2);
};


/**
 * Utility function to compare the position of two nodes, when
 * {@code textNode}'s parent is an ancestor of {@code node}.  If this entry
 * condition is not met, this function will attempt to reference a null object.
 * @param {Node} textNode The textNode to compare.
 * @param {Node} node The node to compare.
 * @return {number} -1 if node is before textNode, +1 otherwise.
 * @private
 */
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if (parent == node) {
    // If textNode is a child of node, then node comes first.
    return -1;
  }
  var sibling = node;
  while (sibling.parentNode != parent) {
    sibling = sibling.parentNode;
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode);
};


/**
 * Utility function to compare the position of two nodes known to be non-equal
 * siblings.
 * @param {Node} node1 The first node to compare.
 * @param {Node} node2 The second node to compare.
 * @return {number} -1 if node1 is before node2, +1 otherwise.
 * @private
 */
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while ((s = s.previousSibling)) {
    if (s == node1) {
      // We just found node1 before node2.
      return -1;
    }
  }

  // Since we didn't find it, node1 must be after node2.
  return 1;
};


/**
 * Find the deepest common ancestor of the given nodes.
 * @param {...Node} var_args The nodes to find a common ancestor of.
 * @return {Node} The common ancestor of the nodes, or null if there is none.
 *     null will only be returned if two or more of the nodes are from different
 *     documents.
 */
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if (!count) {
    return null;
  } else if (count == 1) {
    return arguments[0];
  }

  var paths = [];
  var minLength = Infinity;
  for (i = 0; i < count; i++) {
    // Compute the list of ancestors.
    var ancestors = [];
    var node = arguments[i];
    while (node) {
      ancestors.unshift(node);
      node = node.parentNode;
    }

    // Save the list for comparison.
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length);
  }
  var output = null;
  for (i = 0; i < minLength; i++) {
    var first = paths[0][i];
    for (var j = 1; j < count; j++) {
      if (first != paths[j][i]) {
        return output;
      }
    }
    output = first;
  }
  return output;
};


/**
 * Returns the owner document for a node.
 * @param {Node|Window} node The node to get the document for.
 * @return {!Document} The document owning the node.
 */
goog.dom.getOwnerDocument = function(node) {
  // TODO(arv): Remove IE5 code.
  // IE5 uses document instead of ownerDocument
  return /** @type {!Document} */ (
      node.nodeType == goog.dom.NodeType.DOCUMENT ? node :
      node.ownerDocument || node.document);
};


/**
 * Cross-browser function for getting the document element of a frame or iframe.
 * @param {Element} frame Frame element.
 * @return {!Document} The frame content document.
 */
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc;
};


/**
 * Cross-browser function for getting the window of a frame or iframe.
 * @param {Element} frame Frame element.
 * @return {Window} The window associated with the given frame.
 */
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow ||
      goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame));
};


/**
 * Cross-browser function for setting the text content of an element.
 * @param {Element} element The element to change the text content of.
 * @param {string} text The string that should replace the current element
 *     content.
 */
goog.dom.setTextContent = function(element, text) {
  if ('textContent' in element) {
    element.textContent = text;
  } else if (element.firstChild &&
             element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
    // If the first child is a text node we just change its data and remove the
    // rest of the children.
    while (element.lastChild != element.firstChild) {
      element.removeChild(element.lastChild);
    }
    element.firstChild.data = text;
  } else {
    goog.dom.removeChildren(element);
    var doc = goog.dom.getOwnerDocument(element);
    element.appendChild(doc.createTextNode(text));
  }
};


/**
 * Gets the outerHTML of a node, which islike innerHTML, except that it
 * actually contains the HTML of the node itself.
 * @param {Element} element The element to get the HTML of.
 * @return {string} The outerHTML of the given element.
 */
goog.dom.getOuterHtml = function(element) {
  // IE, Opera and WebKit all have outerHTML.
  if ('outerHTML' in element) {
    return element.outerHTML;
  } else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement('div');
    div.appendChild(element.cloneNode(true));
    return div.innerHTML;
  }
};


/**
 * Finds the first descendant node that matches the filter function, using
 * a depth first search. This function offers the most general purpose way
 * of finding a matching element. You may also wish to consider
 * {@code goog.dom.query} which can express many matching criteria using
 * CSS selector expressions. These expressions often result in a more
 * compact representation of the desired result.
 * @see goog.dom.query
 *
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {Node|undefined} The found node or undefined if none is found.
 */
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined;
};


/**
 * Finds all the descendant nodes that match the filter function, using a
 * a depth first search. This function offers the most general-purpose way
 * of finding a set of matching elements. You may also wish to consider
 * {@code goog.dom.query} which can express many matching criteria using
 * CSS selector expressions. These expressions often result in a more
 * compact representation of the desired result.

 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {!Array.<!Node>} The found nodes or an empty array if none are found.
 */
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv;
};


/**
 * Finds the first or all the descendant nodes that match the filter function,
 * using a depth first search.
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @param {!Array.<!Node>} rv The found nodes are added to this array.
 * @param {boolean} findOne If true we exit after the first found node.
 * @return {boolean} Whether the search is complete or not. True in case findOne
 *     is true and the node is found. False otherwise.
 * @private
 */
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if (root != null) {
    var child = root.firstChild;
    while (child) {
      if (p(child)) {
        rv.push(child);
        if (findOne) {
          return true;
        }
      }
      if (goog.dom.findNodes_(child, p, rv, findOne)) {
        return true;
      }
      child = child.nextSibling;
    }
  }
  return false;
};


/**
 * Map of tags whose content to ignore when calculating text length.
 * @type {Object}
 * @private
 */
goog.dom.TAGS_TO_IGNORE_ = {
  'SCRIPT': 1,
  'STYLE': 1,
  'HEAD': 1,
  'IFRAME': 1,
  'OBJECT': 1
};


/**
 * Map of tags which have predefined values with regard to whitespace.
 * @type {Object}
 * @private
 */
goog.dom.PREDEFINED_TAG_VALUES_ = {'IMG': ' ', 'BR': '\n'};


/**
 * Returns true if the element has a tab index that allows it to receive
 * keyboard focus (tabIndex >= 0), false otherwise.  Note that form elements
 * natively support keyboard focus, even if they have no tab index.
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element has a tab index that allows keyboard
 *     focus.
 * @see http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
 */
goog.dom.isFocusableTabIndex = function(element) {
  // IE returns 0 for an unset tabIndex, so we must use getAttributeNode(),
  // which returns an object with a 'specified' property if tabIndex is
  // specified.  This works on other browsers, too.
  var attrNode = element.getAttributeNode('tabindex'); // Must be lowercase!
  if (attrNode && attrNode.specified) {
    var index = element.tabIndex;
    // NOTE: IE9 puts tabIndex in 16-bit int, e.g. -2 is 65534.
    return goog.isNumber(index) && index >= 0 && index < 32768;
  }
  return false;
};


/**
 * Enables or disables keyboard focus support on the element via its tab index.
 * Only elements for which {@link goog.dom.isFocusableTabIndex} returns true
 * (or elements that natively support keyboard focus, like form elements) can
 * receive keyboard focus.  See http://go/tabindex for more info.
 * @param {Element} element Element whose tab index is to be changed.
 * @param {boolean} enable Whether to set or remove a tab index on the element
 *     that supports keyboard focus.
 */
goog.dom.setFocusableTabIndex = function(element, enable) {
  if (enable) {
    element.tabIndex = 0;
  } else {
    // Set tabIndex to -1 first, then remove it. This is a workaround for
    // Safari (confirmed in version 4 on Windows). When removing the attribute
    // without setting it to -1 first, the element remains keyboard focusable
    // despite not having a tabIndex attribute anymore.
    element.tabIndex = -1;
    element.removeAttribute('tabIndex'); // Must be camelCase!
  }
};


/**
 * Returns the text content of the current node, without markup and invisible
 * symbols. New lines are stripped and whitespace is collapsed,
 * such that each character would be visible.
 *
 * In browsers that support it, innerText is used.  Other browsers attempt to
 * simulate it via node traversal.  Line breaks are canonicalized in IE.
 *
 * @param {Node} node The node from which we are getting content.
 * @return {string} The text content.
 */
goog.dom.getTextContent = function(node) {
  var textContent;
  // Note(arv): IE9, Opera, and Safari 3 support innerText but they include
  // text nodes in script tags. So we revert to use a user agent test here.
  if (goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && ('innerText' in node)) {
    textContent = goog.string.canonicalizeNewlines(node.innerText);
    // Unfortunately .innerText() returns text with &shy; symbols
    // We need to filter it out and then remove duplicate whitespaces
  } else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join('');
  }

  // Strip &shy; entities. goog.format.insertWordBreaks inserts them in Opera.
  textContent = textContent.replace(/ \xAD /g, ' ').replace(/\xAD/g, '');
  // Strip &#8203; entities. goog.format.insertWordBreaks inserts them in IE8.
  textContent = textContent.replace(/\u200B/g, '');

  // Skip this replacement on old browsers with working innerText, which
  // automatically turns &nbsp; into ' ' and / +/ into ' ' when reading
  // innerText.
  if (!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, ' ');
  }
  if (textContent != ' ') {
    textContent = textContent.replace(/^\s*/, '');
  }

  return textContent;
};


/**
 * Returns the text content of the current node, without markup.
 *
 * Unlike {@code getTextContent} this method does not collapse whitespaces
 * or normalize lines breaks.
 *
 * @param {Node} node The node from which we are getting content.
 * @return {string} The raw text content.
 */
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);

  return buf.join('');
};


/**
 * Recursive support function for text content retrieval.
 *
 * @param {Node} node The node from which we are getting content.
 * @param {Array} buf string buffer.
 * @param {boolean} normalizeWhitespace Whether to normalize whitespace.
 * @private
 */
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if (node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    // ignore certain tags
  } else if (node.nodeType == goog.dom.NodeType.TEXT) {
    if (normalizeWhitespace) {
      buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ''));
    } else {
      buf.push(node.nodeValue);
    }
  } else if (node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
    buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName]);
  } else {
    var child = node.firstChild;
    while (child) {
      goog.dom.getTextContent_(child, buf, normalizeWhitespace);
      child = child.nextSibling;
    }
  }
};


/**
 * Returns the text length of the text contained in a node, without markup. This
 * is equivalent to the selection length if the node was selected, or the number
 * of cursor movements to traverse the node. Images & BRs take one space.  New
 * lines are ignored.
 *
 * @param {Node} node The node whose text content length is being calculated.
 * @return {number} The length of {@code node}'s text content.
 */
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length;
};


/**
 * Returns the text offset of a node relative to one of its ancestors. The text
 * length is the same as the length calculated by goog.dom.getNodeTextLength.
 *
 * @param {Node} node The node whose offset is being calculated.
 * @param {Node=} opt_offsetParent The node relative to which the offset will
 *     be calculated. Defaults to the node's owner document's body.
 * @return {number} The text offset.
 */
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while (node && node != root) {
    var cur = node;
    while ((cur = cur.previousSibling)) {
      buf.unshift(goog.dom.getTextContent(cur));
    }
    node = node.parentNode;
  }
  // Trim left to deal with FF cases when there might be line breaks and empty
  // nodes at the front of the text
  return goog.string.trimLeft(buf.join('')).replace(/ +/g, ' ').length;
};


/**
 * Returns the node at a given offset in a parent node.  If an object is
 * provided for the optional third parameter, the node and the remainder of the
 * offset will stored as properties of this object.
 * @param {Node} parent The parent node.
 * @param {number} offset The offset into the parent node.
 * @param {Object=} opt_result Object to be used to store the return value. The
 *     return value will be stored in the form {node: Node, remainder: number}
 *     if this object is provided.
 * @return {Node} The node at the given offset.
 */
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while (stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if (cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
      // ignore certain tags
    } else if (cur.nodeType == goog.dom.NodeType.TEXT) {
      var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, '').replace(/ +/g, ' ');
      pos += text.length;
    } else if (cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
      pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length;
    } else {
      for (var i = cur.childNodes.length - 1; i >= 0; i--) {
        stack.push(cur.childNodes[i]);
      }
    }
  }
  if (goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur;
  }

  return cur;
};


/**
 * Returns true if the object is a {@code NodeList}.  To qualify as a NodeList,
 * the object must have a numeric length property and an item function (which
 * has type 'string' on IE for some reason).
 * @param {Object} val Object to test.
 * @return {boolean} Whether the object is a NodeList.
 */
goog.dom.isNodeList = function(val) {
  // TODO(attila): Now the isNodeList is part of goog.dom we can use
  // goog.userAgent to make this simpler.
  // A NodeList must have a length property of type 'number' on all platforms.
  if (val && typeof val.length == 'number') {
    // A NodeList is an object everywhere except Safari, where it's a function.
    if (goog.isObject(val)) {
      // A NodeList must have an item function (on non-IE platforms) or an item
      // property of type 'string' (on IE).
      return typeof val.item == 'function' || typeof val.item == 'string';
    } else if (goog.isFunction(val)) {
      // On Safari, a NodeList is a function with an item property that is also
      // a function.
      return typeof val.item == 'function';
    }
  }

  // Not a NodeList.
  return false;
};


/**
 * Walks up the DOM hierarchy returning the first ancestor that has the passed
 * tag name and/or class name. If the passed element matches the specified
 * criteria, the element itself is returned.
 * @param {Node} element The DOM node to start with.
 * @param {?(goog.dom.TagName|string)=} opt_tag The tag name to match (or
 *     null/undefined to match only based on class name).
 * @param {?string=} opt_class The class name to match (or null/undefined to
 *     match only based on tag name).
 * @return {Element} The first ancestor that matches the passed criteria, or
 *     null if no match is found.
 */
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  if (!opt_tag && !opt_class) {
    return null;
  }
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return /** @type {Element} */ (goog.dom.getAncestor(element,
      function(node) {
        return (!tagName || node.nodeName == tagName) &&
               (!opt_class || goog.dom.classes.has(node, opt_class));
      }, true));
};


/**
 * Walks up the DOM hierarchy returning the first ancestor that has the passed
 * class name. If the passed element matches the specified criteria, the
 * element itself is returned.
 * @param {Node} element The DOM node to start with.
 * @param {string} className The class name to match.
 * @return {Element} The first ancestor that matches the passed criteria, or
 *     null if none match.
 */
goog.dom.getAncestorByClass = function(element, className) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, className);
};


/**
 * Walks up the DOM hierarchy returning the first ancestor that passes the
 * matcher function.
 * @param {Node} element The DOM node to start with.
 * @param {function(Node) : boolean} matcher A function that returns true if the
 *     passed node matches the desired criteria.
 * @param {boolean=} opt_includeNode If true, the node itself is included in
 *     the search (the first call to the matcher will pass startElement as
 *     the node to test).
 * @param {number=} opt_maxSearchSteps Maximum number of levels to search up the
 *     dom.
 * @return {Node} DOM node that matched the matcher, or null if there was
 *     no match.
 */
goog.dom.getAncestor = function(
    element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if (!opt_includeNode) {
    element = element.parentNode;
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while (element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if (matcher(element)) {
      return element;
    }
    element = element.parentNode;
    steps++;
  }
  // Reached the root of the DOM without a match
  return null;
};


/**
 * Determines the active element in the given document.
 * @param {Document} doc The document to look in.
 * @return {Element} The active element.
 */
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement;
  } catch (e) {
    // NOTE(nicksantos): Sometimes, evaluating document.activeElement in IE
    // throws an exception. I'm not 100% sure why, but I suspect it chokes
    // on document.activeElement if the activeElement has been recently
    // removed from the DOM by a JS operation.
    //
    // We assume that an exception here simply means
    // "there is no active element."
  }

  return null;
};



/**
 * Create an instance of a DOM helper with a new document object.
 * @param {Document=} opt_document Document object to associate with this
 *     DOM helper.
 * @constructor
 */
goog.dom.DomHelper = function(opt_document) {
  /**
   * Reference to the document object to use
   * @type {!Document}
   * @private
   */
  this.document_ = opt_document || goog.global.document || document;
};


/**
 * Gets the dom helper object for the document where the element resides.
 * @param {Node=} opt_node If present, gets the DomHelper for this node.
 * @return {!goog.dom.DomHelper} The DomHelper.
 */
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;


/**
 * Sets the document object.
 * @param {!Document} document Document object.
 */
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document;
};


/**
 * Gets the document object being used by the dom library.
 * @return {!Document} Document object.
 */
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_;
};


/**
 * Alias for {@code getElementById}. If a DOM node is passed in then we just
 * return that.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 */
goog.dom.DomHelper.prototype.getElement = function(element) {
  if (goog.isString(element)) {
    return this.document_.getElementById(element);
  } else {
    return element;
  }
};


/**
 * Alias for {@code getElement}.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 * @deprecated Use {@link goog.dom.DomHelper.prototype.getElement} instead.
 */
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;


/**
 * Looks up elements by both tag and class name, using browser native functions
 * ({@code querySelectorAll}, {@code getElementsByTagName} or
 * {@code getElementsByClassName}) where possible. The returned array is a live
 * NodeList or a static list depending on the code path taken.
 *
 * @see goog.dom.query
 *
 * @param {?string=} opt_tag Element tag name or * for all tags.
 * @param {?string=} opt_class Optional class name.
 * @param {(Document|Element)=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 */
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag,
                                                                     opt_class,
                                                                     opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag,
                                                opt_class, opt_el);
};


/**
 * Returns an array of all the elements with the provided className.
 * @see {goog.dom.query}
 * @param {string} className the name of the class to look for.
 * @param {Element|Document=} opt_el Optional element to look in.
 * @return { {length: number} } The items found with the class name provided.
 */
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc);
};


/**
 * Returns the first element we find matching the provided class name.
 * @see {goog.dom.query}
 * @param {string} className the name of the class to look for.
 * @param {(Element|Document)=} opt_el Optional element to look in.
 * @return {Element} The first item found with the class name provided.
 */
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc);
};


/**
 * Alias for {@code getElementsByTagNameAndClass}.
 * @deprecated Use DomHelper getElementsByTagNameAndClass.
 * @see goog.dom.query
 *
 * @param {?string=} opt_tag Element tag name.
 * @param {?string=} opt_class Optional class name.
 * @param {Element=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 */
goog.dom.DomHelper.prototype.$$ =
    goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;


/**
 * Sets a number of properties on a node.
 * @param {Element} element DOM node to set properties on.
 * @param {Object} properties Hash of property:value pairs.
 */
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;


/**
 * Gets the dimensions of the viewport.
 * @param {Window=} opt_window Optional window element to test. Defaults to
 *     the window of the Dom Helper.
 * @return {!goog.math.Size} Object with values 'width' and 'height'.
 */
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  // TODO(arv): This should not take an argument. That breaks the rule of a
  // a DomHelper representing a single frame/window/document.
  return goog.dom.getViewportSize(opt_window || this.getWindow());
};


/**
 * Calculates the height of the document.
 *
 * @return {number} The height of the document.
 */
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow());
};


/**
 * Typedef for use with goog.dom.createDom and goog.dom.append.
 * @typedef {Object|string|Array|NodeList}
 */
goog.dom.Appendable;


/**
 * Returns a dom node with a set of attributes.  This function accepts varargs
 * for subsequent nodes to be added.  Subsequent nodes will be added to the
 * first node as childNodes.
 *
 * So:
 * <code>createDom('div', null, createDom('p'), createDom('p'));</code>
 * would return a div with two child paragraphs
 *
 * An easy way to move all child nodes of an existing element to a new parent
 * element is:
 * <code>createDom('div', null, oldElement.childNodes);</code>
 * which will remove all child nodes from the old element and add them as
 * child nodes of the new DIV.
 *
 * @param {string} tagName Tag to create.
 * @param {Object|string=} opt_attributes If object, then a map of name-value
 *     pairs for attributes. If a string, then this is the className of the new
 *     element.
 * @param {...goog.dom.Appendable} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or
 *     NodeList, its elements will be added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 */
goog.dom.DomHelper.prototype.createDom = function(tagName,
                                                  opt_attributes,
                                                  var_args) {
  return goog.dom.createDom_(this.document_, arguments);
};


/**
 * Alias for {@code createDom}.
 * @param {string} tagName Tag to create.
 * @param {(Object|string)=} opt_attributes If object, then a map of name-value
 *     pairs for attributes. If a string, then this is the className of the new
 *     element.
 * @param {...goog.dom.Appendable} var_args Further DOM nodes or strings for
 *     text nodes.  If one of the var_args is an array, its children will be
 *     added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 * @deprecated Use {@link goog.dom.DomHelper.prototype.createDom} instead.
 */
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;


/**
 * Creates a new element.
 * @param {string} name Tag name.
 * @return {!Element} The new element.
 */
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name);
};


/**
 * Creates a new text node.
 * @param {string} content Content.
 * @return {!Text} The new text node.
 */
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content);
};


/**
 * Create a table.
 * @param {number} rows The number of rows in the table.  Must be >= 1.
 * @param {number} columns The number of columns in the table.  Must be >= 1.
 * @param {boolean=} opt_fillWithNbsp If true, fills table entries with nsbps.
 * @return {!Element} The created table.
 */
goog.dom.DomHelper.prototype.createTable = function(rows, columns,
    opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns,
      !!opt_fillWithNbsp);
};


/**
 * Converts an HTML string into a node or a document fragment.  A single Node
 * is used if the {@code htmlString} only generates a single node.  If the
 * {@code htmlString} generates multiple nodes then these are put inside a
 * {@code DocumentFragment}.
 *
 * @param {string} htmlString The HTML string to convert.
 * @return {!Node} The resulting node.
 */
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString);
};


/**
 * Returns the compatMode of the document.
 * @return {string} The result is either CSS1Compat or BackCompat.
 * @deprecated use goog.dom.DomHelper.prototype.isCss1CompatMode instead.
 */
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? 'CSS1Compat' : 'BackCompat';
};


/**
 * Returns true if the browser is in "CSS1-compatible" (standards-compliant)
 * mode, false otherwise.
 * @return {boolean} True if in CSS1-compatible mode.
 */
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_);
};


/**
 * Gets the window object associated with the document.
 * @return {!Window} The window associated with the given document.
 */
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_);
};


/**
 * Gets the document scroll element.
 * @return {Element} Scrolling element.
 */
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_);
};


/**
 * Gets the document scroll distance as a coordinate object.
 * @return {!goog.math.Coordinate} Object with properties 'x' and 'y'.
 */
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_);
};


/**
 * Determines the active element in the given document.
 * @param {Document=} opt_doc The document to look in.
 * @return {Element} The active element.
 */
goog.dom.DomHelper.prototype.getActiveElement = function(opt_doc) {
  return goog.dom.getActiveElement(opt_doc || this.document_);
};


/**
 * Appends a child to a node.
 * @param {Node} parent Parent.
 * @param {Node} child Child.
 */
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;


/**
 * Appends a node with text or other nodes.
 * @param {!Node} parent The node to append nodes to.
 * @param {...goog.dom.Appendable} var_args The things to append to the node.
 *     If this is a Node it is appended as is.
 *     If this is a string then a text node is appended.
 *     If this is an array like object then fields 0 to length - 1 are appended.
 */
goog.dom.DomHelper.prototype.append = goog.dom.append;


/**
 * Determines if the given node can contain children, intended to be used for
 * HTML generation.
 *
 * @param {Node} node The node to check.
 * @return {boolean} Whether the node can contain children.
 */
goog.dom.DomHelper.prototype.canHaveChildren = goog.dom.canHaveChildren;


/**
 * Removes all the child nodes on a DOM node.
 * @param {Node} node Node to remove children from.
 */
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;


/**
 * Inserts a new node before an existing reference node (i.e., as the previous
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert before.
 */
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;


/**
 * Inserts a new node after an existing reference node (i.e., as the next
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert after.
 */
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;


/**
 * Insert a child at a given index. If index is larger than the number of child
 * nodes that the parent currently has, the node is inserted as the last child
 * node.
 * @param {Element} parent The element into which to insert the child.
 * @param {Node} child The element to insert.
 * @param {number} index The index at which to insert the new child node. Must
 *     not be negative.
 */
goog.dom.DomHelper.prototype.insertChildAt = goog.dom.insertChildAt;


/**
 * Removes a node from its parent.
 * @param {Node} node The node to remove.
 * @return {Node} The node removed if removed; else, null.
 */
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;


/**
 * Replaces a node in the DOM tree. Will do nothing if {@code oldNode} has no
 * parent.
 * @param {Node} newNode Node to insert.
 * @param {Node} oldNode Node to replace.
 */
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;


/**
 * Flattens an element. That is, removes it and replace it with its children.
 * @param {Element} element The element to flatten.
 * @return {Element|undefined} The original element, detached from the document
 *     tree, sans children, or undefined if the element was already not in the
 *     document.
 */
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;


/**
 * Returns an array containing just the element children of the given element.
 * @param {Element} element The element whose element children we want.
 * @return {!(Array|NodeList)} An array or array-like list of just the element
 *     children of the given element.
 */
goog.dom.DomHelper.prototype.getChildren = goog.dom.getChildren;


/**
 * Returns the first child node that is an element.
 * @param {Node} node The node to get the first child element of.
 * @return {Element} The first child node of {@code node} that is an element.
 */
goog.dom.DomHelper.prototype.getFirstElementChild =
    goog.dom.getFirstElementChild;


/**
 * Returns the last child node that is an element.
 * @param {Node} node The node to get the last child element of.
 * @return {Element} The last child node of {@code node} that is an element.
 */
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;


/**
 * Returns the first next sibling that is an element.
 * @param {Node} node The node to get the next sibling element of.
 * @return {Element} The next sibling of {@code node} that is an element.
 */
goog.dom.DomHelper.prototype.getNextElementSibling =
    goog.dom.getNextElementSibling;


/**
 * Returns the first previous sibling that is an element.
 * @param {Node} node The node to get the previous sibling element of.
 * @return {Element} The first previous sibling of {@code node} that is
 *     an element.
 */
goog.dom.DomHelper.prototype.getPreviousElementSibling =
    goog.dom.getPreviousElementSibling;


/**
 * Returns the next node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The next node in the DOM tree, or null if this was the last
 *     node.
 */
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;


/**
 * Returns the previous node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The previous node in the DOM tree, or null if this was the
 *     first node.
 */
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;


/**
 * Whether the object looks like a DOM node.
 * @param {*} obj The object being tested for node likeness.
 * @return {boolean} Whether the object looks like a DOM node.
 */
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;


/**
 * Whether the object looks like an Element.
 * @param {*} obj The object being tested for Element likeness.
 * @return {boolean} Whether the object looks like an Element.
 */
goog.dom.DomHelper.prototype.isElement = goog.dom.isElement;


/**
 * Returns true if the specified value is a Window object. This includes the
 * global window for HTML pages, and iframe windows.
 * @param {*} obj Variable to test.
 * @return {boolean} Whether the variable is a window.
 */
goog.dom.DomHelper.prototype.isWindow = goog.dom.isWindow;


/**
 * Returns an element's parent, if it's an Element.
 * @param {Element} element The DOM element.
 * @return {Element} The parent, or null if not an Element.
 */
goog.dom.DomHelper.prototype.getParentElement = goog.dom.getParentElement;


/**
 * Whether a node contains another node.
 * @param {Node} parent The node that should contain the other node.
 * @param {Node} descendant The node to test presence of.
 * @return {boolean} Whether the parent node contains the descendent node.
 */
goog.dom.DomHelper.prototype.contains = goog.dom.contains;


/**
 * Compares the document order of two nodes, returning 0 if they are the same
 * node, a negative number if node1 is before node2, and a positive number if
 * node2 is before node1.  Note that we compare the order the tags appear in the
 * document so in the tree <b><i>text</i></b> the B node is considered to be
 * before the I node.
 *
 * @param {Node} node1 The first node to compare.
 * @param {Node} node2 The second node to compare.
 * @return {number} 0 if the nodes are the same node, a negative number if node1
 *     is before node2, and a positive number if node2 is before node1.
 */
goog.dom.DomHelper.prototype.compareNodeOrder = goog.dom.compareNodeOrder;


/**
 * Find the deepest common ancestor of the given nodes.
 * @param {...Node} var_args The nodes to find a common ancestor of.
 * @return {Node} The common ancestor of the nodes, or null if there is none.
 *     null will only be returned if two or more of the nodes are from different
 *     documents.
 */
goog.dom.DomHelper.prototype.findCommonAncestor = goog.dom.findCommonAncestor;


/**
 * Returns the owner document for a node.
 * @param {Node} node The node to get the document for.
 * @return {!Document} The document owning the node.
 */
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;


/**
 * Cross browser function for getting the document element of an iframe.
 * @param {Element} iframe Iframe element.
 * @return {!Document} The frame content document.
 */
goog.dom.DomHelper.prototype.getFrameContentDocument =
    goog.dom.getFrameContentDocument;


/**
 * Cross browser function for getting the window of a frame or iframe.
 * @param {Element} frame Frame element.
 * @return {Window} The window associated with the given frame.
 */
goog.dom.DomHelper.prototype.getFrameContentWindow =
    goog.dom.getFrameContentWindow;


/**
 * Cross browser function for setting the text content of an element.
 * @param {Element} element The element to change the text content of.
 * @param {string} text The string that should replace the current element
 *     content with.
 */
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;


/**
 * Gets the outerHTML of a node, which islike innerHTML, except that it
 * actually contains the HTML of the node itself.
 * @param {Element} element The element to get the HTML of.
 * @return {string} The outerHTML of the given element.
 */
goog.dom.DomHelper.prototype.getOuterHtml = goog.dom.getOuterHtml;


/**
 * Finds the first descendant node that matches the filter function. This does
 * a depth first search.
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {Node|undefined} The found node or undefined if none is found.
 */
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;


/**
 * Finds all the descendant nodes that matches the filter function. This does a
 * depth first search.
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {Array.<Node>} The found nodes or an empty array if none are found.
 */
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;


/**
 * Returns true if the element has a tab index that allows it to receive
 * keyboard focus (tabIndex >= 0), false otherwise.  Note that form elements
 * natively support keyboard focus, even if they have no tab index.
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element has a tab index that allows keyboard
 *     focus.
 */
goog.dom.DomHelper.prototype.isFocusableTabIndex = goog.dom.isFocusableTabIndex;


/**
 * Enables or disables keyboard focus support on the element via its tab index.
 * Only elements for which {@link goog.dom.isFocusableTabIndex} returns true
 * (or elements that natively support keyboard focus, like form elements) can
 * receive keyboard focus.  See http://go/tabindex for more info.
 * @param {Element} element Element whose tab index is to be changed.
 * @param {boolean} enable Whether to set or remove a tab index on the element
 *     that supports keyboard focus.
 */
goog.dom.DomHelper.prototype.setFocusableTabIndex =
    goog.dom.setFocusableTabIndex;


/**
 * Returns the text contents of the current node, without markup. New lines are
 * stripped and whitespace is collapsed, such that each character would be
 * visible.
 *
 * In browsers that support it, innerText is used.  Other browsers attempt to
 * simulate it via node traversal.  Line breaks are canonicalized in IE.
 *
 * @param {Node} node The node from which we are getting content.
 * @return {string} The text content.
 */
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;


/**
 * Returns the text length of the text contained in a node, without markup. This
 * is equivalent to the selection length if the node was selected, or the number
 * of cursor movements to traverse the node. Images & BRs take one space.  New
 * lines are ignored.
 *
 * @param {Node} node The node whose text content length is being calculated.
 * @return {number} The length of {@code node}'s text content.
 */
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;


/**
 * Returns the text offset of a node relative to one of its ancestors. The text
 * length is the same as the length calculated by
 * {@code goog.dom.getNodeTextLength}.
 *
 * @param {Node} node The node whose offset is being calculated.
 * @param {Node=} opt_offsetParent Defaults to the node's owner document's body.
 * @return {number} The text offset.
 */
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;


/**
 * Returns the node at a given offset in a parent node.  If an object is
 * provided for the optional third parameter, the node and the remainder of the
 * offset will stored as properties of this object.
 * @param {Node} parent The parent node.
 * @param {number} offset The offset into the parent node.
 * @param {Object=} opt_result Object to be used to store the return value. The
 *     return value will be stored in the form {node: Node, remainder: number}
 *     if this object is provided.
 * @return {Node} The node at the given offset.
 */
goog.dom.DomHelper.prototype.getNodeAtOffset = goog.dom.getNodeAtOffset;


/**
 * Returns true if the object is a {@code NodeList}.  To qualify as a NodeList,
 * the object must have a numeric length property and an item function (which
 * has type 'string' on IE for some reason).
 * @param {Object} val Object to test.
 * @return {boolean} Whether the object is a NodeList.
 */
goog.dom.DomHelper.prototype.isNodeList = goog.dom.isNodeList;


/**
 * Walks up the DOM hierarchy returning the first ancestor that has the passed
 * tag name and/or class name. If the passed element matches the specified
 * criteria, the element itself is returned.
 * @param {Node} element The DOM node to start with.
 * @param {?(goog.dom.TagName|string)=} opt_tag The tag name to match (or
 *     null/undefined to match only based on class name).
 * @param {?string=} opt_class The class name to match (or null/undefined to
 *     match only based on tag name).
 * @return {Element} The first ancestor that matches the passed criteria, or
 *     null if no match is found.
 */
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass =
    goog.dom.getAncestorByTagNameAndClass;


/**
 * Walks up the DOM hierarchy returning the first ancestor that has the passed
 * class name. If the passed element matches the specified criteria, the
 * element itself is returned.
 * @param {Node} element The DOM node to start with.
 * @param {string} class The class name to match.
 * @return {Element} The first ancestor that matches the passed criteria, or
 *     null if none match.
 */
goog.dom.DomHelper.prototype.getAncestorByClass =
    goog.dom.getAncestorByClass;


/**
 * Walks up the DOM hierarchy returning the first ancestor that passes the
 * matcher function.
 * @param {Node} element The DOM node to start with.
 * @param {function(Node) : boolean} matcher A function that returns true if the
 *     passed node matches the desired criteria.
 * @param {boolean=} opt_includeNode If true, the node itself is included in
 *     the search (the first call to the matcher will pass startElement as
 *     the node to test).
 * @param {number=} opt_maxSearchSteps Maximum number of levels to search up the
 *     dom.
 * @return {Node} DOM node that matched the matcher, or null if there was
 *     no match.
 */
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A utility class for representing a numeric box.
 */


goog.provide('goog.math.Box');

goog.require('goog.math.Coordinate');



/**
 * Class for representing a box. A box is specified as a top, right, bottom,
 * and left. A box is useful for representing margins and padding.
 *
 * @param {number} top Top.
 * @param {number} right Right.
 * @param {number} bottom Bottom.
 * @param {number} left Left.
 * @constructor
 */
goog.math.Box = function(top, right, bottom, left) {
  /**
   * Top
   * @type {number}
   */
  this.top = top;

  /**
   * Right
   * @type {number}
   */
  this.right = right;

  /**
   * Bottom
   * @type {number}
   */
  this.bottom = bottom;

  /**
   * Left
   * @type {number}
   */
  this.left = left;
};


/**
 * Creates a Box by bounding a collection of goog.math.Coordinate objects
 * @param {...goog.math.Coordinate} var_args Coordinates to be included inside
 *     the box.
 * @return {!goog.math.Box} A Box containing all the specified Coordinates.
 */
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x,
                              arguments[0].y, arguments[0].x);
  for (var i = 1; i < arguments.length; i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x);
  }
  return box;
};


/**
 * Creates a copy of the box with the same dimensions.
 * @return {!goog.math.Box} A clone of this Box.
 */
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left);
};


if (goog.DEBUG) {
  /**
   * Returns a nice string representing the box.
   * @return {string} In the form (50t, 73r, 24b, 13l).
   * @override
   */
  goog.math.Box.prototype.toString = function() {
    return '(' + this.top + 't, ' + this.right + 'r, ' + this.bottom + 'b, ' +
           this.left + 'l)';
  };
}


/**
 * Returns whether the box contains a coordinate or another box.
 *
 * @param {goog.math.Coordinate|goog.math.Box} other A Coordinate or a Box.
 * @return {boolean} Whether the box contains the coordinate or other box.
 */
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other);
};


/**
 * Expands box with the given margins.
 *
 * @param {number|goog.math.Box} top Top margin or box with all margins.
 * @param {number=} opt_right Right margin.
 * @param {number=} opt_bottom Bottom margin.
 * @param {number=} opt_left Left margin.
 * @return {!goog.math.Box} A reference to this Box.
 */
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom,
    opt_left) {
  if (goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left;
  } else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left;
  }

  return this;
};


/**
 * Expand this box to include another box.
 * NOTE(user): This is used in code that needs to be very fast, please don't
 * add functionality to this function at the expense of speed (variable
 * arguments, accepting multiple argument types, etc).
 * @param {goog.math.Box} box The box to include in this one.
 */
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom);
};


/**
 * Compares boxes for equality.
 * @param {goog.math.Box} a A Box.
 * @param {goog.math.Box} b A Box.
 * @return {boolean} True iff the boxes are equal, or if both are null.
 */
goog.math.Box.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.top == b.top && a.right == b.right &&
         a.bottom == b.bottom && a.left == b.left;
};


/**
 * Returns whether a box contains a coordinate or another box.
 *
 * @param {goog.math.Box} box A Box.
 * @param {goog.math.Coordinate|goog.math.Box} other A Coordinate or a Box.
 * @return {boolean} Whether the box contains the coordinate or other box.
 */
goog.math.Box.contains = function(box, other) {
  if (!box || !other) {
    return false;
  }

  if (other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right &&
        other.top >= box.top && other.bottom <= box.bottom;
  }

  // other is a Coordinate.
  return other.x >= box.left && other.x <= box.right &&
         other.y >= box.top && other.y <= box.bottom;
};


/**
 * Returns the relative x position of a coordinate compared to a box.  Returns
 * zero if the coordinate is inside the box.
 *
 * @param {goog.math.Box} box A Box.
 * @param {goog.math.Coordinate} coord A Coordinate.
 * @return {number} The x position of {@code coord} relative to the nearest
 *     side of {@code box}, or zero if {@code coord} is inside {@code box}.
 */
goog.math.Box.relativePositionX = function(box, coord) {
  if (coord.x < box.left) {
    return coord.x - box.left;
  } else if (coord.x > box.right) {
    return coord.x - box.right;
  }
  return 0;
};


/**
 * Returns the relative y position of a coordinate compared to a box.  Returns
 * zero if the coordinate is inside the box.
 *
 * @param {goog.math.Box} box A Box.
 * @param {goog.math.Coordinate} coord A Coordinate.
 * @return {number} The y position of {@code coord} relative to the nearest
 *     side of {@code box}, or zero if {@code coord} is inside {@code box}.
 */
goog.math.Box.relativePositionY = function(box, coord) {
  if (coord.y < box.top) {
    return coord.y - box.top;
  } else if (coord.y > box.bottom) {
    return coord.y - box.bottom;
  }
  return 0;
};


/**
 * Returns the distance between a coordinate and the nearest corner/side of a
 * box. Returns zero if the coordinate is inside the box.
 *
 * @param {goog.math.Box} box A Box.
 * @param {goog.math.Coordinate} coord A Coordinate.
 * @return {number} The distance between {@code coord} and the nearest
 *     corner/side of {@code box}, or zero if {@code coord} is inside
 *     {@code box}.
 */
goog.math.Box.distance = function(box, coord) {
  var x = goog.math.Box.relativePositionX(box, coord);
  var y = goog.math.Box.relativePositionY(box, coord);
  return Math.sqrt(x * x + y * y);
};


/**
 * Returns whether two boxes intersect.
 *
 * @param {goog.math.Box} a A Box.
 * @param {goog.math.Box} b A second Box.
 * @return {boolean} Whether the boxes intersect.
 */
goog.math.Box.intersects = function(a, b) {
  return (a.left <= b.right && b.left <= a.right &&
          a.top <= b.bottom && b.top <= a.bottom);
};


/**
 * Returns whether two boxes would intersect with additional padding.
 *
 * @param {goog.math.Box} a A Box.
 * @param {goog.math.Box} b A second Box.
 * @param {number} padding The additional padding.
 * @return {boolean} Whether the boxes intersect.
 */
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return (a.left <= b.right + padding && b.left <= a.right + padding &&
          a.top <= b.bottom + padding && b.top <= a.bottom + padding);
};
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A utility class for representing rectangles.
 */


goog.provide('goog.math.Rect');

goog.require('goog.math.Box');
goog.require('goog.math.Size');



/**
 * Class for representing rectangular regions.
 * @param {number} x Left.
 * @param {number} y Top.
 * @param {number} w Width.
 * @param {number} h Height.
 * @constructor
 */
goog.math.Rect = function(x, y, w, h) {
  /**
   * Left
   * @type {number}
   */
  this.left = x;

  /**
   * Top
   * @type {number}
   */
  this.top = y;

  /**
   * Width
   * @type {number}
   */
  this.width = w;

  /**
   * Height
   * @type {number}
   */
  this.height = h;
};


/**
 * Returns a new copy of the rectangle.
 * @return {!goog.math.Rect} A clone of this Rectangle.
 */
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height);
};


/**
 * Returns a new Box object with the same position and dimensions as this
 * rectangle.
 * @return {!goog.math.Box} A new Box representation of this Rectangle.
 */
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top,
                           right,
                           bottom,
                           this.left);
};


/**
 * Creates a new Rect object with the same position and dimensions as a given
 * Box.  Note that this is only the inverse of toBox if left/top are defined.
 * @param {goog.math.Box} box A box.
 * @return {!goog.math.Rect} A new Rect initialized with the box's position
 *     and size.
 */
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top,
      box.right - box.left, box.bottom - box.top);
};


if (goog.DEBUG) {
  /**
   * Returns a nice string representing size and dimensions of rectangle.
   * @return {string} In the form (50, 73 - 75w x 25h).
   * @override
   */
  goog.math.Rect.prototype.toString = function() {
    return '(' + this.left + ', ' + this.top + ' - ' + this.width + 'w x ' +
           this.height + 'h)';
  };
}


/**
 * Compares rectangles for equality.
 * @param {goog.math.Rect} a A Rectangle.
 * @param {goog.math.Rect} b A Rectangle.
 * @return {boolean} True iff the rectangles have the same left, top, width,
 *     and height, or if both are null.
 */
goog.math.Rect.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.left == b.left && a.width == b.width &&
         a.top == b.top && a.height == b.height;
};


/**
 * Computes the intersection of this rectangle and the rectangle parameter.  If
 * there is no intersection, returns false and leaves this rectangle as is.
 * @param {goog.math.Rect} rect A Rectangle.
 * @return {boolean} True iff this rectangle intersects with the parameter.
 */
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);

  if (x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);

    if (y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;

      return true;
    }
  }
  return false;
};


/**
 * Returns the intersection of two rectangles. Two rectangles intersect if they
 * touch at all, for example, two zero width and height rectangles would
 * intersect if they had the same top and left.
 * @param {goog.math.Rect} a A Rectangle.
 * @param {goog.math.Rect} b A Rectangle.
 * @return {goog.math.Rect} A new intersection rect (even if width and height
 *     are 0), or null if there is no intersection.
 */
goog.math.Rect.intersection = function(a, b) {
  // There is no nice way to do intersection via a clone, because any such
  // clone might be unnecessary if this function returns null.  So, we duplicate
  // code from above.

  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);

  if (x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);

    if (y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0);
    }
  }
  return null;
};


/**
 * Returns whether two rectangles intersect. Two rectangles intersect if they
 * touch at all, for example, two zero width and height rectangles would
 * intersect if they had the same top and left.
 * @param {goog.math.Rect} a A Rectangle.
 * @param {goog.math.Rect} b A Rectangle.
 * @return {boolean} Whether a and b intersect.
 */
goog.math.Rect.intersects = function(a, b) {
  return (a.left <= b.left + b.width && b.left <= a.left + a.width &&
      a.top <= b.top + b.height && b.top <= a.top + a.height);
};


/**
 * Returns whether a rectangle intersects this rectangle.
 * @param {goog.math.Rect} rect A rectangle.
 * @return {boolean} Whether rect intersects this rectangle.
 */
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect);
};


/**
 * Computes the difference regions between two rectangles. The return value is
 * an array of 0 to 4 rectangles defining the remaining regions of the first
 * rectangle after the second has been subtracted.
 * @param {goog.math.Rect} a A Rectangle.
 * @param {goog.math.Rect} b A Rectangle.
 * @return {!Array.<!goog.math.Rect>} An array with 0 to 4 rectangles which
 *     together define the difference area of rectangle a minus rectangle b.
 */
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if (!intersection || !intersection.height || !intersection.width) {
    return [a.clone()];
  }

  var result = [];

  var top = a.top;
  var height = a.height;

  var ar = a.left + a.width;
  var ab = a.top + a.height;

  var br = b.left + b.width;
  var bb = b.top + b.height;

  // Subtract off any area on top where A extends past B
  if (b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    // If we're moving the top down, we also need to subtract the height diff.
    height -= b.top - a.top;
  }
  // Subtract off any area on bottom where A extends past B
  if (bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top;
  }
  // Subtract any area on left where A extends past B
  if (b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height));
  }
  // Subtract any area on right where A extends past B
  if (br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height));
  }

  return result;
};


/**
 * Computes the difference regions between this rectangle and {@code rect}. The
 * return value is an array of 0 to 4 rectangles defining the remaining regions
 * of this rectangle after the other has been subtracted.
 * @param {goog.math.Rect} rect A Rectangle.
 * @return {!Array.<!goog.math.Rect>} An array with 0 to 4 rectangles which
 *     together define the difference area of rectangle a minus rectangle b.
 */
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect);
};


/**
 * Expand this rectangle to also include the area of the given rectangle.
 * @param {goog.math.Rect} rect The other rectangle.
 */
goog.math.Rect.prototype.boundingRect = function(rect) {
  // We compute right and bottom before we change left and top below.
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);

  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);

  this.width = right - this.left;
  this.height = bottom - this.top;
};


/**
 * Returns a new rectangle which completely contains both input rectangles.
 * @param {goog.math.Rect} a A rectangle.
 * @param {goog.math.Rect} b A rectangle.
 * @return {goog.math.Rect} A new bounding rect, or null if either rect is
 *     null.
 */
goog.math.Rect.boundingRect = function(a, b) {
  if (!a || !b) {
    return null;
  }

  var clone = a.clone();
  clone.boundingRect(b);

  return clone;
};


/**
 * Tests whether this rectangle entirely contains another rectangle or
 * coordinate.
 *
 * @param {goog.math.Rect|goog.math.Coordinate} another The rectangle or
 *     coordinate to test for containment.
 * @return {boolean} Whether this rectangle contains given rectangle or
 *     coordinate.
 */
goog.math.Rect.prototype.contains = function(another) {
  if (another instanceof goog.math.Rect) {
    return this.left <= another.left &&
           this.left + this.width >= another.left + another.width &&
           this.top <= another.top &&
           this.top + this.height >= another.top + another.height;
  } else { // (another instanceof goog.math.Coordinate)
    return another.x >= this.left &&
           another.x <= this.left + this.width &&
           another.y >= this.top &&
           another.y <= this.top + this.height;
  }
};


/**
 * Returns the size of this rectangle.
 * @return {!goog.math.Size} The size of this rectangle.
 */
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height);
};
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for element styles.
 *
 * @see ../demos/inline_block_quirks.html
 * @see ../demos/inline_block_standards.html
 * @see ../demos/style_viewport.html
 */

goog.provide('goog.style');


goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.math.Box');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Rect');
goog.require('goog.math.Size');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.userAgent');


/**
 * Sets a style value on an element.
 *
 * This function is not indended to patch issues in the browser's style
 * handling, but to allow easy programmatic access to setting dash-separated
 * style properties.  An example is setting a batch of properties from a data
 * object without overwriting old styles.  When possible, use native APIs:
 * elem.style.propertyKey = 'value' or (if obliterating old styles is fine)
 * elem.style.cssText = 'property1: value1; property2: value2'.
 *
 * @param {Element} element The element to change.
 * @param {string|Object} style If a string, a style name. If an object, a hash
 *     of style names to style values.
 * @param {string|number|boolean=} opt_value If style was a string, then this
 *     should be the value.
 */
goog.style.setStyle = function(element, style, opt_value) {
  if (goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style);
  } else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element));
  }
};


/**
 * Sets a style value on an element, with parameters swapped to work with
 * {@code goog.object.forEach()}.
 * @param {Element} element The element to change.
 * @param {string|number|boolean|undefined} value Style value.
 * @param {string} style Style name.
 * @private
 */
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value;
};


/**
 * Retrieves an explicitly-set style value of a node. This returns '' if there
 * isn't a style attribute on the element or if this style property has not been
 * explicitly set in script.
 *
 * @param {Element} element Element to get style of.
 * @param {string} property Property to get, css-style (if you have a camel-case
 * property, use element.style[style]).
 * @return {string} Style value.
 */
goog.style.getStyle = function(element, property) {
  // element.style is '' for well-known properties which are unset.
  // For for browser specific styles as 'filter' is undefined
  // so we need to return '' explicitly to make it consistent across
  // browsers.
  return element.style[goog.string.toCamelCase(property)] || '';
};


/**
 * Retrieves a computed style value of a node. It returns empty string if the
 * value cannot be computed (which will be the case in Internet Explorer) or
 * "none" if the property requested is an SVG one and it has not been
 * explicitly set (firefox and webkit).
 *
 * @param {Element} element Element to get style of.
 * @param {string} property Property to get (camel-case).
 * @return {string} Style value.
 */
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if (doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if (styles) {
      // element.style[..] is undefined for browser specific styles
      // as 'filter'.
      return styles[property] || styles.getPropertyValue(property) || '';
    }
  }

  return '';
};


/**
 * Gets the cascaded style value of a node, or null if the value cannot be
 * computed (only Internet Explorer can do this).
 *
 * @param {Element} element Element to get style of.
 * @param {string} style Property to get (camel-case).
 * @return {string} Style value.
 */
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null;
};


/**
 * Cross-browser pseudo get computed style. It returns the computed style where
 * available. If not available it tries the cascaded style value (IE
 * currentStyle) and in worst case the inline style value.  It shouldn't be
 * called directly, see http://wiki/Main/ComputedStyleVsCascadedStyle for
 * discussion.
 *
 * @param {Element} element Element to get style of.
 * @param {string} style Property to get (must be camelCase, not css-style.).
 * @return {string} Style value.
 * @private
 */
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) ||
         goog.style.getCascadedStyle(element, style) ||
         (element.style && element.style[style]);
};


/**
 * Retrieves the computed value of the position CSS attribute.
 * @param {Element} element The element to get the position of.
 * @return {string} Position value.
 */
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, 'position');
};


/**
 * Retrieves the computed background color string for a given element. The
 * string returned is suitable for assigning to another element's
 * background-color, but is not guaranteed to be in any particular string
 * format. Accessing the color in a numeric form may not be possible in all
 * browsers or with all input.
 *
 * If the background color for the element is defined as a hexadecimal value,
 * the resulting string can be parsed by goog.color.parse in all supported
 * browsers.
 *
 * Whether named colors like "red" or "lightblue" get translated into a
 * format which can be parsed is browser dependent. Calling this function on
 * transparent elements will return "transparent" in most browsers or
 * "rgba(0, 0, 0, 0)" in WebKit.
 * @param {Element} element The element to get the background color of.
 * @return {string} The computed string value of the background color.
 */
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, 'backgroundColor');
};


/**
 * Retrieves the computed value of the overflow-x CSS attribute.
 * @param {Element} element The element to get the overflow-x of.
 * @return {string} The computed string value of the overflow-x attribute.
 */
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, 'overflowX');
};


/**
 * Retrieves the computed value of the overflow-y CSS attribute.
 * @param {Element} element The element to get the overflow-y of.
 * @return {string} The computed string value of the overflow-y attribute.
 */
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, 'overflowY');
};


/**
 * Retrieves the computed value of the z-index CSS attribute.
 * @param {Element} element The element to get the z-index of.
 * @return {string|number} The computed value of the z-index attribute.
 */
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, 'zIndex');
};


/**
 * Retrieves the computed value of the text-align CSS attribute.
 * @param {Element} element The element to get the text-align of.
 * @return {string} The computed string value of the text-align attribute.
 */
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, 'textAlign');
};


/**
 * Retrieves the computed value of the cursor CSS attribute.
 * @param {Element} element The element to get the cursor of.
 * @return {string} The computed string value of the cursor attribute.
 */
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, 'cursor');
};


/**
 * Sets the top/left values of an element.  If no unit is specified in the
 * argument then it will add px. The second argument is required if the first
 * argument is a string or number and is ignored if the first argument
 * is a coordinate.
 * @param {Element} el Element to move.
 * @param {string|number|goog.math.Coordinate} arg1 Left position or coordinate.
 * @param {string|number=} opt_arg2 Top position.
 */
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO &&
      (goog.userAgent.MAC || goog.userAgent.X11) &&
      goog.userAgent.isVersion('1.9');

  if (arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y;
  } else {
    x = arg1;
    y = opt_arg2;
  }

  // Round to the nearest pixel for buggy sub-pixel support.
  el.style.left = goog.style.getPixelStyleValue_(
      /** @type {number|string} */ (x), buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(
      /** @type {number|string} */ (y), buggyGeckoSubPixelPos);
};


/**
 * Gets the offsetLeft and offsetTop properties of an element and returns them
 * in a Coordinate object
 * @param {Element} element Element.
 * @return {!goog.math.Coordinate} The position.
 */
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop);
};


/**
 * Returns the viewport element for a particular document
 * @param {Node=} opt_node DOM node (Document is OK) to get the viewport element
 *     of.
 * @return {Element} document.documentElement or document.body.
 */
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if (opt_node) {
    doc = goog.dom.getOwnerDocument(opt_node);
  } else {
    doc = goog.dom.getDocument();
  }

  // In old IE versions the document.body represented the viewport
  if (goog.userAgent.IE && !goog.userAgent.isDocumentMode(9) &&
      !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body;
  }
  return doc.documentElement;
};


/**
 * Calculates the viewport coordinates relative to the page/document
 * containing the node. The viewport may be the browser viewport for
 * non-iframe document, or the iframe container for iframe'd document.
 * @param {!Document} doc The document to use as the reference point.
 * @return {!goog.math.Coordinate} The page offset of the viewport.
 */
goog.style.getViewportPageOffset = function(doc) {
  var body = doc.body;
  var documentElement = doc.documentElement;
  var scrollLeft = body.scrollLeft || documentElement.scrollLeft;
  var scrollTop = body.scrollTop || documentElement.scrollTop;
  return new goog.math.Coordinate(scrollLeft, scrollTop);
};


/**
 * Gets the client rectangle of the DOM element.
 *
 * getBoundingClientRect is part of a new CSS object model draft (with a
 * long-time presence in IE), replacing the error-prone parent offset
 * computation and the now-deprecated Gecko getBoxObjectFor.
 *
 * This utility patches common browser bugs in getBoundingClientRect. It
 * will fail if getBoundingClientRect is unsupported.
 *
 * If the element is not in the DOM, the result is undefined, and an error may
 * be thrown depending on user agent.
 *
 * @param {!Element} el The element whose bounding rectangle is being queried.
 * @return {Object} A native bounding rectangle with numerical left, top,
 *     right, and bottom.  Reported by Firefox to be of object type ClientRect.
 * @private
 */
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  // Patch the result in IE only, so that this function can be inlined if
  // compiled for non-IE.
  if (goog.userAgent.IE) {

    // In IE, most of the time, 2 extra pixels are added to the top and left
    // due to the implicit 2-pixel inset border.  In IE6/7 quirks mode and
    // IE6 standards mode, this border can be overridden by setting the
    // document element's border to zero -- thus, we cannot rely on the
    // offset always being 2 pixels.

    // In quirks mode, the offset can be determined by querying the body's
    // clientLeft/clientTop, but in standards mode, it is found by querying
    // the document element's clientLeft/clientTop.  Since we already called
    // getBoundingClientRect we have already forced a reflow, so it is not
    // too expensive just to query them all.

    // See: http://msdn.microsoft.com/en-us/library/ms536433(VS.85).aspx
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop;
  }
  return /** @type {Object} */ (rect);
};


/**
 * Returns the first parent that could affect the position of a given element.
 * @param {Element} element The element to get the offset parent for.
 * @return {Element} The first offset parent or null if one cannot be found.
 */
goog.style.getOffsetParent = function(element) {
  // element.offsetParent does the right thing in IE7 and below.  In other
  // browsers it only includes elements with position absolute, relative or
  // fixed, not elements with overflow set to auto or scroll.
  if (goog.userAgent.IE && !goog.userAgent.isDocumentMode(8)) {
    return element.offsetParent;
  }

  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, 'position');
  var skipStatic = positionStyle == 'fixed' || positionStyle == 'absolute';
  for (var parent = element.parentNode; parent && parent != doc;
       parent = parent.parentNode) {
    positionStyle =
        goog.style.getStyle_(/** @type {!Element} */ (parent), 'position');
    skipStatic = skipStatic && positionStyle == 'static' &&
                 parent != doc.documentElement && parent != doc.body;
    if (!skipStatic && (parent.scrollWidth > parent.clientWidth ||
                        parent.scrollHeight > parent.clientHeight ||
                        positionStyle == 'fixed' ||
                        positionStyle == 'absolute' ||
                        positionStyle == 'relative')) {
      return /** @type {!Element} */ (parent);
    }
  }
  return null;
};


/**
 * Calculates and returns the visible rectangle for a given element. Returns a
 * box describing the visible portion of the nearest scrollable offset ancestor.
 * Coordinates are given relative to the document.
 *
 * @param {Element} element Element to get the visible rect for.
 * @return {goog.math.Box} Bounding elementBox describing the visible rect or
 *     null if scrollable ancestor isn't inside the visible viewport.
 */
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var documentElement = dom.getDocument().documentElement;
  var scrollEl = dom.getDocumentScrollElement();

  // Determine the size of the visible rect by climbing the dom accounting for
  // all scrollable containers.
  for (var el = element; el = goog.style.getOffsetParent(el); ) {
    // clientWidth is zero for inline block elements in IE.
    // on WEBKIT, body element can have clientHeight = 0 and scrollHeight > 0
    if ((!goog.userAgent.IE || el.clientWidth != 0) &&
        (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) &&
        // body may have overflow set on it, yet we still get the entire
        // viewport. In some browsers, el.offsetParent may be
        // document.documentElement, so check for that too.
        (el != body && el != documentElement &&
            goog.style.getStyle_(el, 'overflow') != 'visible')) {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;

      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right,
                                   pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom,
                                    pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
    }
  }

  // Clip by window's viewport.
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  visibleRect.left = Math.max(visibleRect.left, scrollX);
  visibleRect.top = Math.max(visibleRect.top, scrollY);
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 &&
         visibleRect.bottom > visibleRect.top &&
         visibleRect.right > visibleRect.left ?
         visibleRect : null;
};


/**
 * Calculate the scroll position of {@code container} with the minimum amount so
 * that the content and the borders of the given {@code element} become visible.
 * If the element is bigger than the container, its top left corner will be
 * aligned as close to the container's top left corner as possible.
 *
 * @param {Element} element The element to make visible.
 * @param {Element} container The container to scroll.
 * @param {boolean=} opt_center Whether to center the element in the container.
 *     Defaults to false.
 * @return {!goog.math.Coordinate} The new scroll position of the container,
 *     in form of goog.math.Coordinate(scrollLeft, scrollTop).
 */
goog.style.getContainerOffsetToScrollInto =
    function(element, container, opt_center) {
  // Absolute position of the element's border's top left corner.
  var elementPos = goog.style.getPageOffset(element);
  // Absolute position of the container's border's top left corner.
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  // Relative pos. of the element's border box to the container's content box.
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  // How much the element can move in the container, i.e. the difference between
  // the element's bottom-right-most and top-left-most position where it's
  // fully visible.
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;

  var scrollLeft = container.scrollLeft;
  var scrollTop = container.scrollTop;
  if (opt_center) {
    // All browsers round non-integer scroll positions down.
    scrollLeft += relX - spaceX / 2;
    scrollTop += relY - spaceY / 2;
  } else {
    // This formula was designed to give the correct scroll values in the
    // following cases:
    // - element is higher than container (spaceY < 0) => scroll down by relY
    // - element is not higher that container (spaceY >= 0):
    //   - it is above container (relY < 0) => scroll up by abs(relY)
    //   - it is below container (relY > spaceY) => scroll down by relY - spaceY
    //   - it is in the container => don't scroll
    scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    scrollTop += Math.min(relY, Math.max(relY - spaceY, 0));
  }
  return new goog.math.Coordinate(scrollLeft, scrollTop);
};


/**
 * Changes the scroll position of {@code container} with the minimum amount so
 * that the content and the borders of the given {@code element} become visible.
 * If the element is bigger than the container, its top left corner will be
 * aligned as close to the container's top left corner as possible.
 *
 * @param {Element} element The element to make visible.
 * @param {Element} container The container to scroll.
 * @param {boolean=} opt_center Whether to center the element in the container.
 *     Defaults to false.
 */
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var offset =
      goog.style.getContainerOffsetToScrollInto(element, container, opt_center);
  container.scrollLeft = offset.x;
  container.scrollTop = offset.y;
};


/**
 * Returns clientLeft (width of the left border and, if the directionality is
 * right to left, the vertical scrollbar) and clientTop as a coordinate object.
 *
 * @param {Element} el Element to get clientLeft for.
 * @return {!goog.math.Coordinate} Client left and top.
 */
goog.style.getClientLeftTop = function(el) {
  // NOTE(eae): Gecko prior to 1.9 doesn't support clientTop/Left, see
  // https://bugzilla.mozilla.org/show_bug.cgi?id=111207
  if (goog.userAgent.GECKO && !goog.userAgent.isVersion('1.9')) {
    var left = parseFloat(goog.style.getComputedStyle(el, 'borderLeftWidth'));
    if (goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left -
          parseFloat(goog.style.getComputedStyle(el, 'borderRightWidth'));
      left += scrollbarWidth;
    }
    return new goog.math.Coordinate(left,
        parseFloat(goog.style.getComputedStyle(el, 'borderTopWidth')));
  }

  return new goog.math.Coordinate(el.clientLeft, el.clientTop);
};


/**
 * Returns a Coordinate object relative to the top-left of the HTML document.
 * Implemented as a single function to save having to do two recursive loops in
 * opera and safari just to get both coordinates.  If you just want one value do
 * use goog.style.getPageOffsetLeft() and goog.style.getPageOffsetTop(), but
 * note if you call both those methods the tree will be analysed twice.
 *
 * @param {Element} el Element to get the page offset for.
 * @return {!goog.math.Coordinate} The page offset.
 */
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, 'position');
  // TODO(gboyer): Update the jsdoc in a way that doesn't break the universe.
  goog.asserts.assertObject(el, 'Parameter is required');

  // NOTE(eae): Gecko pre 1.9 normally use getBoxObjectFor to calculate the
  // position. When invoked for an element with position absolute and a negative
  // position though it can be off by one. Therefor the recursive implementation
  // is used in those (relatively rare) cases.
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor &&
      !el.getBoundingClientRect && positionStyle == 'absolute' &&
      (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);

  // NOTE(arv): If element is hidden (display none or disconnected or any the
  // ancestors are hidden) we get (0,0) by default but we still do the
  // accumulation of scroll position.

  // TODO(arv): Should we check if the node is disconnected and in that case
  //            return (0,0)?

  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if (el == viewportElement) {
    // viewport is always at 0,0 as that defined the coordinate system for this
    // function - this avoids special case checks in the code below
    return pos;
  }

  // IE, Gecko 1.9+, and most modern WebKit.
  if (el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    // Must add the scroll coordinates in to get the absolute page offset
    // of element since getBoundingClientRect returns relative coordinates to
    // the viewport.
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y;

  // Gecko prior to 1.9.
  } else if (doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
    // Gecko ignores the scroll values for ancestors, up to 1.9.  See:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=328881 and
    // https://bugzilla.mozilla.org/show_bug.cgi?id=330619

    box = doc.getBoxObjectFor(el);
    // TODO(user): Fix the off-by-one error when window is scrolled down
    // or right more than 1 pixel. The viewport offset does not move in lock
    // step with the window scroll; it moves in increments of 2px and at
    // somewhat random intervals.
    var vpBox = doc.getBoxObjectFor(viewportElement);
    pos.x = box.screenX - vpBox.screenX;
    pos.y = box.screenY - vpBox.screenY;

  // Safari, Opera and Camino up to 1.0.4.
  } else {
    var parent = el;
    do {
      pos.x += parent.offsetLeft;
      pos.y += parent.offsetTop;
      // For safari/chrome, we need to add parent's clientLeft/Top as well.
      if (parent != el) {
        pos.x += parent.clientLeft || 0;
        pos.y += parent.clientTop || 0;
      }
      // In Safari when hit a position fixed element the rest of the offsets
      // are not correct.
      if (goog.userAgent.WEBKIT &&
          goog.style.getComputedPosition(parent) == 'fixed') {
        pos.x += doc.body.scrollLeft;
        pos.y += doc.body.scrollTop;
        break;
      }
      parent = parent.offsetParent;
    } while (parent && parent != el);

    // Opera & (safari absolute) incorrectly account for body offsetTop.
    if (goog.userAgent.OPERA || (goog.userAgent.WEBKIT &&
        positionStyle == 'absolute')) {
      pos.y -= doc.body.offsetTop;
    }

    for (parent = el; (parent = goog.style.getOffsetParent(parent)) &&
        parent != doc.body && parent != viewportElement; ) {
      pos.x -= parent.scrollLeft;
      // Workaround for a bug in Opera 9.2 (and earlier) where table rows may
      // report an invalid scroll top value. The bug was fixed in Opera 9.5
      // however as that version supports getBoundingClientRect it won't
      // trigger this code path. https://bugs.opera.com/show_bug.cgi?id=249965
      if (!goog.userAgent.OPERA || parent.tagName != 'TR') {
        pos.y -= parent.scrollTop;
      }
    }
  }

  return pos;
};


/**
 * Returns the left coordinate of an element relative to the HTML document
 * @param {Element} el Elements.
 * @return {number} The left coordinate.
 */
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x;
};


/**
 * Returns the top coordinate of an element relative to the HTML document
 * @param {Element} el Elements.
 * @return {number} The top coordinate.
 */
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y;
};


/**
 * Returns a Coordinate object relative to the top-left of an HTML document
 * in an ancestor frame of this element. Used for measuring the position of
 * an element inside a frame relative to a containing frame.
 *
 * @param {Element} el Element to get the page offset for.
 * @param {Window} relativeWin The window to measure relative to. If relativeWin
 *     is not in the ancestor frame chain of the element, we measure relative to
 *     the top-most window.
 * @return {!goog.math.Coordinate} The page offset.
 */
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);

  // Iterate up the ancestor frame chain, keeping track of the current window
  // and the current element in that window.
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    // if we're at the top window, we want to get the page offset.
    // if we're at an inner frame, we only want to get the window position
    // so that we can determine the actual page offset in the context of
    // the outer window.
    var offset = currentWin == relativeWin ?
        goog.style.getPageOffset(currentEl) :
        goog.style.getClientPosition(currentEl);

    position.x += offset.x;
    position.y += offset.y;
  } while (currentWin && currentWin != relativeWin &&
      (currentEl = currentWin.frameElement) &&
      (currentWin = currentWin.parent));

  return position;
};


/**
 * Translates the specified rect relative to origBase page, for newBase page.
 * If origBase and newBase are the same, this function does nothing.
 *
 * @param {goog.math.Rect} rect The source rectangle relative to origBase page,
 *     and it will have the translated result.
 * @param {goog.dom.DomHelper} origBase The DomHelper for the input rectangle.
 * @param {goog.dom.DomHelper} newBase The DomHelper for the resultant
 *     coordinate.  This must be a DOM for an ancestor frame of origBase
 *     or the same as origBase.
 */
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if (origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());

    // Adjust Body's margin.
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));

    if (goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll());
    }

    rect.left += pos.x;
    rect.top += pos.y;
  }
};


/**
 * Returns the position of an element relative to another element in the
 * document.  A relative to B
 * @param {Element|Event|goog.events.Event} a Element or mouse event whose
 *     position we're calculating.
 * @param {Element|Event|goog.events.Event} b Element or mouse event position
 *     is relative to.
 * @return {!goog.math.Coordinate} The relative position.
 */
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y);
};


/**
 * Returns the position of the event or the element's border box relative to
 * the client viewport.
 * @param {Element|Event|goog.events.Event} el Element or a mouse / touch event.
 * @return {!goog.math.Coordinate} The position.
 */
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if (el.nodeType == goog.dom.NodeType.ELEMENT) {
    el = /** @type {!Element} */ (el);
    if (el.getBoundingClientRect) {
      // IE, Gecko 1.9+, and most modern WebKit
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top;
    } else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y;
    }
    if (goog.userAgent.GECKO && !goog.userAgent.isVersion(12)) {
      pos = goog.math.Coordinate.sum(pos, goog.style.getCssTranslation(el));
    }
  } else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;

    if (el.targetTouches) {
      targetEvent = el.targetTouches[0];
    } else if (isAbstractedEvent && el.getBrowserEvent().targetTouches) {
      targetEvent = el.getBrowserEvent().targetTouches[0];
    }

    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY;
  }

  return pos;
};


/**
 * Moves an element to the given coordinates relative to the client viewport.
 * @param {Element} el Absolutely positioned element to set page offset for.
 *     It must be in the document.
 * @param {number|goog.math.Coordinate} x Left position of the element's margin
 *     box or a coordinate object.
 * @param {number=} opt_y Top position of the element's margin box.
 */
goog.style.setPageOffset = function(el, x, opt_y) {
  // Get current pageoffset
  var cur = goog.style.getPageOffset(el);

  if (x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x;
  }

  // NOTE(arv): We cannot allow strings for x and y. We could but that would
  // require us to manually transform between different units

  // Work out deltas
  var dx = x - cur.x;
  var dy = opt_y - cur.y;

  // Set position to current left/top + delta
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy);
};


/**
 * Sets the width/height values of an element.  If an argument is numeric,
 * or a goog.math.Size is passed, it is assumed to be pixels and will add
 * 'px' after converting it to an integer in string form. (This just sets the
 * CSS width and height properties so it might set content-box or border-box
 * size depending on the box model the browser is using.)
 *
 * @param {Element} element Element to set the size of.
 * @param {string|number|goog.math.Size} w Width of the element, or a
 *     size object.
 * @param {string|number=} opt_h Height of the element. Required if w is not a
 *     size object.
 */
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if (w instanceof goog.math.Size) {
    h = w.height;
    w = w.width;
  } else {
    if (opt_h == undefined) {
      throw Error('missing height argument');
    }
    h = opt_h;
  }

  goog.style.setWidth(element, /** @type {string|number} */ (w));
  goog.style.setHeight(element, /** @type {string|number} */ (h));
};


/**
 * Helper function to create a string to be set into a pixel-value style
 * property of an element. Can round to the nearest integer value.
 *
 * @param {string|number} value The style value to be used. If a number,
 *     'px' will be appended, otherwise the value will be applied directly.
 * @param {boolean} round Whether to round the nearest integer (if property
 *     is a number).
 * @return {string} The string value for the property.
 * @private
 */
goog.style.getPixelStyleValue_ = function(value, round) {
  if (typeof value == 'number') {
    value = (round ? Math.round(value) : value) + 'px';
  }

  return value;
};


/**
 * Set the height of an element.  Sets the element's style property.
 * @param {Element} element Element to set the height of.
 * @param {string|number} height The height value to set.  If a number, 'px'
 *     will be appended, otherwise the value will be applied directly.
 */
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true);
};


/**
 * Set the width of an element.  Sets the element's style property.
 * @param {Element} element Element to set the width of.
 * @param {string|number} width The width value to set.  If a number, 'px'
 *     will be appended, otherwise the value will be applied directly.
 */
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true);
};


/**
 * Gets the height and width of an element, even if its display is none.
 * Specifically, this returns the height and width of the border box,
 * irrespective of the box model in effect.
 * @param {Element} element Element to get size of.
 * @return {!goog.math.Size} Object with width/height properties.
 */
goog.style.getSize = function(element) {
  if (goog.style.getStyle_(element, 'display') != 'none') {
    return goog.style.getSizeWithDisplay_(element);
  }

  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;

  style.visibility = 'hidden';
  style.position = 'absolute';
  style.display = 'inline';

  var size = goog.style.getSizeWithDisplay_(element);

  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;

  return size;
};


/**
 * Gets the height and with of an element when the display is not none.
 * @param {Element} element Element to get size of.
 * @return {!goog.math.Size} Object with width/height properties.
 * @private
 */
goog.style.getSizeWithDisplay_ = function(element) {
  var offsetWidth = element.offsetWidth;
  var offsetHeight = element.offsetHeight;
  var webkitOffsetsZero =
      goog.userAgent.WEBKIT && !offsetWidth && !offsetHeight;
  if ((!goog.isDef(offsetWidth) || webkitOffsetsZero) &&
      element.getBoundingClientRect) {
    // Fall back to calling getBoundingClientRect when offsetWidth or
    // offsetHeight are not defined, or when they are zero in WebKit browsers.
    // This makes sure that we return for the correct size for SVG elements, but
    // will still return 0 on Webkit prior to 534.8, see
    // http://trac.webkit.org/changeset/67252.
    var clientRect = goog.style.getBoundingClientRect_(element);
    return new goog.math.Size(clientRect.right - clientRect.left,
        clientRect.bottom - clientRect.top);
  }
  return new goog.math.Size(offsetWidth, offsetHeight);
};


/**
 * Returns a bounding rectangle for a given element in page space.
 * @param {Element} element Element to get bounds of. Must not be display none.
 * @return {!goog.math.Rect} Bounding rectangle for the element.
 */
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height);
};


/**
 * Converts a CSS selector in the form style-property to styleProperty.
 * @param {*} selector CSS Selector.
 * @return {string} Camel case selector.
 * @deprecated Use goog.string.toCamelCase instead.
 */
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector));
};


/**
 * Converts a CSS selector in the form styleProperty to style-property.
 * @param {string} selector Camel case selector.
 * @return {string} Selector cased.
 * @deprecated Use goog.string.toSelectorCase instead.
 */
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector);
};


/**
 * Gets the opacity of a node (x-browser). This gets the inline style opacity
 * of the node, and does not take into account the cascaded or the computed
 * style for this node.
 * @param {Element} el Element whose opacity has to be found.
 * @return {number|string} Opacity between 0 and 1 or an empty string {@code ''}
 *     if the opacity is not set.
 */
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = '';
  if ('opacity' in style) {
    result = style.opacity;
  } else if ('MozOpacity' in style) {
    result = style.MozOpacity;
  } else if ('filter' in style) {
    var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
    if (match) {
      result = String(match[1] / 100);
    }
  }
  return result == '' ? result : Number(result);
};


/**
 * Sets the opacity of a node (x-browser).
 * @param {Element} el Elements whose opacity has to be set.
 * @param {number|string} alpha Opacity between 0 and 1 or an empty string
 *     {@code ''} to clear the opacity.
 */
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if ('opacity' in style) {
    style.opacity = alpha;
  } else if ('MozOpacity' in style) {
    style.MozOpacity = alpha;
  } else if ('filter' in style) {
    // TODO(arv): Overwriting the filter might have undesired side effects.
    if (alpha === '') {
      style.filter = '';
    } else {
      style.filter = 'alpha(opacity=' + alpha * 100 + ')';
    }
  }
};


/**
 * Sets the background of an element to a transparent image in a browser-
 * independent manner.
 *
 * This function does not support repeating backgrounds or alternate background
 * positions to match the behavior of Internet Explorer. It also does not
 * support sizingMethods other than crop since they cannot be replicated in
 * browsers other than Internet Explorer.
 *
 * @param {Element} el The element to set background on.
 * @param {string} src The image source URL.
 */
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  // It is safe to use the style.filter in IE only. In Safari 'filter' is in
  // style object but access to style.filter causes it to throw an exception.
  // Note: IE8 supports images with an alpha channel.
  if (goog.userAgent.IE && !goog.userAgent.isVersion('8')) {
    // See TODO in setOpacity.
    style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(' +
        'src="' + src + '", sizingMethod="crop")';
  } else {
    // Set style properties individually instead of using background shorthand
    // to prevent overwriting a pre-existing background color.
    style.backgroundImage = 'url(' + src + ')';
    style.backgroundPosition = 'top left';
    style.backgroundRepeat = 'no-repeat';
  }
};


/**
 * Clears the background image of an element in a browser independent manner.
 * @param {Element} el The element to clear background image for.
 */
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if ('filter' in style) {
    // See TODO in setOpacity.
    style.filter = '';
  } else {
    // Set style properties individually instead of using background shorthand
    // to prevent overwriting a pre-existing background color.
    style.backgroundImage = 'none';
  }
};


/**
 * Shows or hides an element from the page. Hiding the element is done by
 * setting the display property to "none", removing the element from the
 * rendering hierarchy so it takes up no space. To show the element, the default
 * inherited display property is restored (defined either in stylesheets or by
 * the browser's default style rules.)
 *
 * Caveat 1: if the inherited display property for the element is set to "none"
 * by the stylesheets, that is the property that will be restored by a call to
 * showElement(), effectively toggling the display between "none" and "none".
 *
 * Caveat 2: if the element display style is set inline (by setting either
 * element.style.display or a style attribute in the HTML), a call to
 * showElement will clear that setting and defer to the inherited style in the
 * stylesheet.
 * @param {Element} el Element to show or hide.
 * @param {*} display True to render the element in its default style,
 * false to disable rendering the element.
 */
goog.style.showElement = function(el, display) {
  el.style.display = display ? '' : 'none';
};


/**
 * Test whether the given element has been shown or hidden via a call to
 * {@link #showElement}.
 *
 * Note this is strictly a companion method for a call
 * to {@link #showElement} and the same caveats apply; in particular, this
 * method does not guarantee that the return value will be consistent with
 * whether or not the element is actually visible.
 *
 * @param {Element} el The element to test.
 * @return {boolean} Whether the element has been shown.
 * @see #showElement
 */
goog.style.isElementShown = function(el) {
  return el.style.display != 'none';
};


/**
 * Installs the styles string into the window that contains opt_element.  If
 * opt_element is null, the main window is used.
 * @param {string} stylesString The style string to install.
 * @param {Node=} opt_node Node whose parent document should have the
 *     styles installed.
 * @return {Element|StyleSheet} The style element created.
 */
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;

  if (goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString);
  } else {
    var head = dh.getElementsByTagNameAndClass('head')[0];

    // In opera documents are not guaranteed to have a head element, thus we
    // have to make sure one exists before using it.
    if (!head) {
      var body = dh.getElementsByTagNameAndClass('body')[0];
      head = dh.createDom('head');
      body.parentNode.insertBefore(head, body);
    }
    styleSheet = dh.createDom('style');
    // NOTE(user): Setting styles after the style element has been appended
    // to the head results in a nasty Webkit bug in certain scenarios. Please
    // refer to https://bugs.webkit.org/show_bug.cgi?id=26307 for additional
    // details.
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet);
  }
  return styleSheet;
};


/**
 * Removes the styles added by {@link #installStyles}.
 * @param {Element|StyleSheet} styleSheet The value returned by
 *     {@link #installStyles}.
 */
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement ||
      /** @type {Element} */ (styleSheet);
  goog.dom.removeNode(node);
};


/**
 * Sets the content of a style element.  The style element can be any valid
 * style element.  This element will have its content completely replaced by
 * the new stylesString.
 * @param {Element|StyleSheet} element A stylesheet element as returned by
 *     installStyles.
 * @param {string} stylesString The new content of the stylesheet.
 */
goog.style.setStyles = function(element, stylesString) {
  if (goog.userAgent.IE) {
    // Adding the selectors individually caused the browser to hang if the
    // selector was invalid or there were CSS comments.  Setting the cssText of
    // the style node works fine and ignores CSS that IE doesn't understand
    element.cssText = stylesString;
  } else {
    element.innerHTML = stylesString;
  }
};


/**
 * Sets 'white-space: pre-wrap' for a node (x-browser).
 *
 * There are as many ways of specifying pre-wrap as there are browsers.
 *
 * CSS3/IE8: white-space: pre-wrap;
 * Mozilla:  white-space: -moz-pre-wrap;
 * Opera:    white-space: -o-pre-wrap;
 * IE6/7:    white-space: pre; word-wrap: break-word;
 *
 * @param {Element} el Element to enable pre-wrap for.
 */
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if (goog.userAgent.IE && !goog.userAgent.isVersion('8')) {
    style.whiteSpace = 'pre';
    style.wordWrap = 'break-word';
  } else if (goog.userAgent.GECKO) {
    style.whiteSpace = '-moz-pre-wrap';
  } else {
    style.whiteSpace = 'pre-wrap';
  }
};


/**
 * Sets 'display: inline-block' for an element (cross-browser).
 * @param {Element} el Element to which the inline-block display style is to be
 *    applied.
 * @see ../demos/inline_block_quirks.html
 * @see ../demos/inline_block_standards.html
 */
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  // Without position:relative, weirdness ensues.  Just accept it and move on.
  style.position = 'relative';

  if (goog.userAgent.IE && !goog.userAgent.isVersion('8')) {
    // IE8 supports inline-block so fall through to the else
    // Zoom:1 forces hasLayout, display:inline gives inline behavior.
    style.zoom = '1';
    style.display = 'inline';
  } else if (goog.userAgent.GECKO) {
    // Pre-Firefox 3, Gecko doesn't support inline-block, but -moz-inline-box
    // is close enough.
    style.display = goog.userAgent.isVersion('1.9a') ? 'inline-block' :
        '-moz-inline-box';
  } else {
    // Opera, Webkit, and Safari seem to do OK with the standard inline-block
    // style.
    style.display = 'inline-block';
  }
};


/**
 * Returns true if the element is using right to left (rtl) direction.
 * @param {Element} el  The element to test.
 * @return {boolean} True for right to left, false for left to right.
 */
goog.style.isRightToLeft = function(el) {
  return 'rtl' == goog.style.getStyle_(el, 'direction');
};


/**
 * The CSS style property corresponding to an element being
 * unselectable on the current browser platform (null if none).
 * Opera and IE instead use a DOM attribute 'unselectable'.
 * @type {?string}
 * @private
 */
goog.style.unselectableStyle_ =
    goog.userAgent.GECKO ? 'MozUserSelect' :
    goog.userAgent.WEBKIT ? 'WebkitUserSelect' :
    null;


/**
 * Returns true if the element is set to be unselectable, false otherwise.
 * Note that on some platforms (e.g. Mozilla), even if an element isn't set
 * to be unselectable, it will behave as such if any of its ancestors is
 * unselectable.
 * @param {Element} el  Element to check.
 * @return {boolean}  Whether the element is set to be unselectable.
 */
goog.style.isUnselectable = function(el) {
  if (goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == 'none';
  } else if (goog.userAgent.IE || goog.userAgent.OPERA) {
    return el.getAttribute('unselectable') == 'on';
  }
  return false;
};


/**
 * Makes the element and its descendants selectable or unselectable.  Note
 * that on some platforms (e.g. Mozilla), even if an element isn't set to
 * be unselectable, it will behave as such if any of its ancestors is
 * unselectable.
 * @param {Element} el  The element to alter.
 * @param {boolean} unselectable  Whether the element and its descendants
 *     should be made unselectable.
 * @param {boolean=} opt_noRecurse  Whether to only alter the element's own
 *     selectable state, and leave its descendants alone; defaults to false.
 */
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  // TODO(attila): Do we need all of TR_DomUtil.makeUnselectable() in Closure?
  var descendants = !opt_noRecurse ? el.getElementsByTagName('*') : null;
  var name = goog.style.unselectableStyle_;
  if (name) {
    // Add/remove the appropriate CSS style to/from the element and its
    // descendants.
    var value = unselectable ? 'none' : '';
    el.style[name] = value;
    if (descendants) {
      for (var i = 0, descendant; descendant = descendants[i]; i++) {
        descendant.style[name] = value;
      }
    }
  } else if (goog.userAgent.IE || goog.userAgent.OPERA) {
    // Toggle the 'unselectable' attribute on the element and its descendants.
    var value = unselectable ? 'on' : '';
    el.setAttribute('unselectable', value);
    if (descendants) {
      for (var i = 0, descendant; descendant = descendants[i]; i++) {
        descendant.setAttribute('unselectable', value);
      }
    }
  }
};


/**
 * Gets the border box size for an element.
 * @param {Element} element  The element to get the size for.
 * @return {!goog.math.Size} The border box size.
 */
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight);
};


/**
 * Sets the border box size of an element. This is potentially expensive in IE
 * if the document is CSS1Compat mode
 * @param {Element} element  The element to set the size on.
 * @param {goog.math.Size} size  The new size.
 */
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();

  if (goog.userAgent.IE &&
      (!isCss1CompatMode || !goog.userAgent.isVersion('8'))) {
    var style = element.style;
    if (isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left -
                         paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top -
                          paddingBox.bottom - borderBox.bottom;
    } else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height;
    }
  } else {
    goog.style.setBoxSizingSize_(element, size, 'border-box');
  }
};


/**
 * Gets the content box size for an element.  This is potentially expensive in
 * all browsers.
 * @param {Element} element  The element to get the size for.
 * @return {!goog.math.Size} The content box size.
 */
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if (ieCurrentStyle &&
      goog.dom.getDomHelper(doc).isCss1CompatMode() &&
      ieCurrentStyle.width != 'auto' && ieCurrentStyle.height != 'auto' &&
      !ieCurrentStyle.boxSizing) {
    // If IE in CSS1Compat mode than just use the width and height.
    // If we have a boxSizing then fall back on measuring the borders etc.
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width,
                                            'width', 'pixelWidth');
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height,
                                             'height', 'pixelHeight');
    return new goog.math.Size(width, height);
  } else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width -
                              borderBox.left - paddingBox.left -
                              paddingBox.right - borderBox.right,
                              borderBoxSize.height -
                              borderBox.top - paddingBox.top -
                              paddingBox.bottom - borderBox.bottom);
  }
};


/**
 * Sets the content box size of an element. This is potentially expensive in IE
 * if the document is BackCompat mode.
 * @param {Element} element  The element to set the size on.
 * @param {goog.math.Size} size  The new size.
 */
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if (goog.userAgent.IE &&
      (!isCss1CompatMode || !goog.userAgent.isVersion('8'))) {
    var style = element.style;
    if (isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height;
    } else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left +
                         paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top +
                          paddingBox.bottom + borderBox.bottom;
    }
  } else {
    goog.style.setBoxSizingSize_(element, size, 'content-box');
  }
};


/**
 * Helper function that sets the box sizing as well as the width and height
 * @param {Element} element  The element to set the size on.
 * @param {goog.math.Size} size  The new size to set.
 * @param {string} boxSizing  The box-sizing value.
 * @private
 */
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if (goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing;
  } else if (goog.userAgent.WEBKIT) {
    style.WebkitBoxSizing = boxSizing;
  } else {
    // Includes IE8 and Opera 9.50+
    style.boxSizing = boxSizing;
  }

  // Setting this to a negative value will throw an exception on IE
  // (and doesn't do anything different than setting it to 0).
  style.width = Math.max(size.width, 0) + 'px';
  style.height = Math.max(size.height, 0) + 'px';
};


/**
 * IE specific function that converts a non pixel unit to pixels.
 * @param {Element} element  The element to convert the value for.
 * @param {string} value  The current value as a string. The value must not be
 *     ''.
 * @param {string} name  The CSS property name to use for the converstion. This
 *     should be 'left', 'top', 'width' or 'height'.
 * @param {string} pixelName  The CSS pixel property name to use to get the
 *     value in pixels.
 * @return {number} The value in pixels.
 * @private
 */
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  // Try if we already have a pixel value. IE does not do half pixels so we
  // only check if it matches a number followed by 'px'.
  if (/^\d+px?$/.test(value)) {
    return parseInt(value, 10);
  } else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    // set runtime style to prevent changes
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    // restore
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue;
  }
};


/**
 * Helper function for getting the pixel padding or margin for IE.
 * @param {Element} element  The element to get the padding for.
 * @param {string} propName  The property name.
 * @return {number} The pixel padding.
 * @private
 */
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element,
      goog.style.getCascadedStyle(element, propName),
      'left', 'pixelLeft');
};


/**
 * Gets the computed paddings or margins (on all sides) in pixels.
 * @param {Element} element  The element to get the padding for.
 * @param {string} stylePrefix  Pass 'padding' to retrieve the padding box,
 *     or 'margin' to retrieve the margin box.
 * @return {!goog.math.Box} The computed paddings or margins.
 * @private
 */
goog.style.getBox_ = function(element, stylePrefix) {
  if (goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + 'Left');
    var right = goog.style.getIePixelDistance_(element, stylePrefix + 'Right');
    var top = goog.style.getIePixelDistance_(element, stylePrefix + 'Top');
    var bottom = goog.style.getIePixelDistance_(
        element, stylePrefix + 'Bottom');
    return new goog.math.Box(top, right, bottom, left);
  } else {
    // On non-IE browsers, getComputedStyle is always non-null.
    var left = /** @type {string} */ (
        goog.style.getComputedStyle(element, stylePrefix + 'Left'));
    var right = /** @type {string} */ (
        goog.style.getComputedStyle(element, stylePrefix + 'Right'));
    var top = /** @type {string} */ (
        goog.style.getComputedStyle(element, stylePrefix + 'Top'));
    var bottom = /** @type {string} */ (
        goog.style.getComputedStyle(element, stylePrefix + 'Bottom'));

    // NOTE(arv): Gecko can return floating point numbers for the computed
    // style values.
    return new goog.math.Box(parseFloat(top),
                             parseFloat(right),
                             parseFloat(bottom),
                             parseFloat(left));
  }
};


/**
 * Gets the computed paddings (on all sides) in pixels.
 * @param {Element} element  The element to get the padding for.
 * @return {!goog.math.Box} The computed paddings.
 */
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, 'padding');
};


/**
 * Gets the computed margins (on all sides) in pixels.
 * @param {Element} element  The element to get the margins for.
 * @return {!goog.math.Box} The computed margins.
 */
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, 'margin');
};


/**
 * A map used to map the border width keywords to a pixel width.
 * @type {Object}
 * @private
 */
goog.style.ieBorderWidthKeywords_ = {
  'thin': 2,
  'medium': 4,
  'thick': 6
};


/**
 * Helper function for IE to get the pixel border.
 * @param {Element} element  The element to get the pixel border for.
 * @param {string} prop  The part of the property name.
 * @return {number} The value in pixels.
 * @private
 */
goog.style.getIePixelBorder_ = function(element, prop) {
  if (goog.style.getCascadedStyle(element, prop + 'Style') == 'none') {
    return 0;
  }
  var width = goog.style.getCascadedStyle(element, prop + 'Width');
  if (width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width];
  }
  return goog.style.getIePixelValue_(element, width, 'left', 'pixelLeft');
};


/**
 * Gets the computed border widths (on all sides) in pixels
 * @param {Element} element  The element to get the border widths for.
 * @return {!goog.math.Box} The computed border widths.
 */
goog.style.getBorderBox = function(element) {
  if (goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, 'borderLeft');
    var right = goog.style.getIePixelBorder_(element, 'borderRight');
    var top = goog.style.getIePixelBorder_(element, 'borderTop');
    var bottom = goog.style.getIePixelBorder_(element, 'borderBottom');
    return new goog.math.Box(top, right, bottom, left);
  } else {
    // On non-IE browsers, getComputedStyle is always non-null.
    var left = /** @type {string} */ (
        goog.style.getComputedStyle(element, 'borderLeftWidth'));
    var right = /** @type {string} */ (
        goog.style.getComputedStyle(element, 'borderRightWidth'));
    var top = /** @type {string} */ (
        goog.style.getComputedStyle(element, 'borderTopWidth'));
    var bottom = /** @type {string} */ (
        goog.style.getComputedStyle(element, 'borderBottomWidth'));

    return new goog.math.Box(parseFloat(top),
                             parseFloat(right),
                             parseFloat(bottom),
                             parseFloat(left));
  }
};


/**
 * Returns the font face applied to a given node. Opera and IE should return
 * the font actually displayed. Firefox returns the author's most-preferred
 * font (whether the browser is capable of displaying it or not.)
 * @param {Element} el  The element whose font family is returned.
 * @return {string} The font family applied to el.
 */
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = '';
  if (doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    /** @preserveTry */
    try {
      font = range.queryCommandValue('FontName');
    } catch (e) {
      // This is a workaround for a awkward exception.
      // On some IE, there is an exception coming from it.
      // The error description from this exception is:
      // This window has already been registered as a drop target
      // This is bogus description, likely due to a bug in ie.
      font = '';
    }
  }
  if (!font) {
    // Note if for some reason IE can't derive FontName with a TextRange, we
    // fallback to using currentStyle
    font = goog.style.getStyle_(el, 'fontFamily');
  }

  // Firefox returns the applied font-family string (author's list of
  // preferred fonts.) We want to return the most-preferred font, in lieu of
  // the *actually* applied font.
  var fontsArray = font.split(',');
  if (fontsArray.length > 1) font = fontsArray[0];

  // Sanitize for x-browser consistency:
  // Strip quotes because browsers aren't consistent with how they're
  // applied; Opera always encloses, Firefox sometimes, and IE never.
  return goog.string.stripQuotes(font, '"\'');
};


/**
 * Regular expression used for getLengthUnits.
 * @type {RegExp}
 * @private
 */
goog.style.lengthUnitRegex_ = /[^\d]+$/;


/**
 * Returns the units used for a CSS length measurement.
 * @param {string} value  A CSS length quantity.
 * @return {?string} The units of measurement.
 */
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null;
};


/**
 * Map of absolute CSS length units
 * @type {Object}
 * @private
 */
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {
  'cm' : 1,
  'in' : 1,
  'mm' : 1,
  'pc' : 1,
  'pt' : 1
};


/**
 * Map of relative CSS length units that can be accurately converted to px
 * font-size values using getIePixelValue_. Only units that are defined in
 * relation to a font size are convertible (%, small, etc. are not).
 * @type {Object}
 * @private
 */
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {
  'em' : 1,
  'ex' : 1
};


/**
 * Returns the font size, in pixels, of text in an element.
 * @param {Element} el  The element whose font size is returned.
 * @return {number} The font size (in pixels).
 */
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, 'fontSize');
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if (fontSize && 'px' == sizeUnits) {
    // NOTE(user): This could be parseFloat instead, but IE doesn't return
    // decimal fractions in getStyle_ and Firefox reports the fractions, but
    // ignores them when rendering. Interestingly enough, when we force the
    // issue and size something to e.g., 50% of 25px, the browsers round in
    // opposite directions with Firefox reporting 12px and IE 13px. I punt.
    return parseInt(fontSize, 10);
  }

  // In IE, we can convert absolute length units to a px value using
  // goog.style.getIePixelValue_. Units defined in relation to a font size
  // (em, ex) are applied relative to the element's parentNode and can also
  // be converted.
  if (goog.userAgent.IE) {
    if (sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el,
                                         fontSize,
                                         'left',
                                         'pixelLeft');
    } else if (el.parentNode &&
               el.parentNode.nodeType == goog.dom.NodeType.ELEMENT &&
               sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
      // Check the parent size - if it is the same it means the relative size
      // value is inherited and we therefore don't want to count it twice.  If
      // it is different, this element either has explicit style or has a CSS
      // rule applying to it.
      var parentElement = /** @type {Element} */ (el.parentNode);
      var parentSize = goog.style.getStyle_(parentElement, 'fontSize');
      return goog.style.getIePixelValue_(parentElement,
                                         fontSize == parentSize ?
                                             '1em' : fontSize,
                                         'left',
                                         'pixelLeft');
    }
  }

  // Sometimes we can't cleanly find the font size (some units relative to a
  // node's parent's font size are difficult: %, smaller et al), so we create
  // an invisible, absolutely-positioned span sized to be the height of an 'M'
  // rendered in its parent's (i.e., our target element's) font size. This is
  // the definition of CSS's font size attribute.
  var sizeElement = goog.dom.createDom(
      'span',
      {'style': 'visibility:hidden;position:absolute;' +
            'line-height:0;padding:0;margin:0;border:0;height:1em;'});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);

  return fontSize;
};


/**
 * Parses a style attribute value.  Converts CSS property names to camel case.
 * @param {string} value The style attribute value.
 * @return {!Object} Map of CSS properties to string values.
 */
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if (keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1];
    }
  });
  return result;
};


/**
 * Reverse of parseStyleAttribute; that is, takes a style object and returns the
 * corresponding attribute value.  Converts camel case property names to proper
 * CSS selector names.
 * @param {Object} obj Map of CSS properties to values.
 * @return {string} The style attribute value.
 */
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ':', value, ';');
  });
  return buffer.join('');
};


/**
 * Sets CSS float property on an element.
 * @param {Element} el The element to set float property on.
 * @param {string} value The value of float CSS property to set on this element.
 */
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? 'styleFloat' : 'cssFloat'] = value;
};


/**
 * Gets value of explicitly-set float CSS property on an element.
 * @param {Element} el The element to get float property of.
 * @return {string} The value of explicitly-set float CSS property on this
 *     element.
 */
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? 'styleFloat' : 'cssFloat'] || '';
};


/**
 * Returns the scroll bar width (represents the width of both horizontal
 * and vertical scroll).
 *
 * @param {string=} opt_className An optional class name (or names) to apply
 *     to the invisible div created to measure the scrollbar. This is necessary
 *     if some scrollbars are styled differently than others.
 * @return {number} The scroll bar width in px.
 */
goog.style.getScrollbarWidth = function(opt_className) {
  // Add two hidden divs.  The child div is larger than the parent and
  // forces scrollbars to appear on it.
  // Using overflow:scroll does not work consistently with scrollbars that
  // are styled with ::-webkit-scrollbar.
  var outerDiv = goog.dom.createElement('div');
  if (opt_className) {
    outerDiv.className = opt_className;
  }
  outerDiv.style.cssText = 'overflow:auto;' +
      'position:absolute;top:0;width:100px;height:100px';
  var innerDiv = goog.dom.createElement('div');
  goog.style.setSize(innerDiv, '200px', '200px');
  outerDiv.appendChild(innerDiv);
  goog.dom.appendChild(goog.dom.getDocument().body, outerDiv);
  var width = outerDiv.offsetWidth - outerDiv.clientWidth;
  goog.dom.removeNode(outerDiv);
  return width;
};


/**
 * Regular expression to extract x and y translation components from a CSS
 * transform Matrix representation.
 *
 * @type {!RegExp}
 * @const
 * @private
 */
goog.style.MATRIX_TRANSLATION_REGEX_ =
    new RegExp('matrix\\([0-9\\.\\-]+, [0-9\\.\\-]+, ' +
               '[0-9\\.\\-]+, [0-9\\.\\-]+, ' +
               '([0-9\\.\\-]+)p?x?, ([0-9\\.\\-]+)p?x?\\)');


/**
 * Returns the x,y translation component of any CSS transforms applied to the
 * element, in pixels.
 *
 * @param {!Element} element The element to get the translation of.
 * @return {!goog.math.Coordinate} The CSS translation of the element in px.
 */
goog.style.getCssTranslation = function(element) {
  var property;
  if (goog.userAgent.IE) {
    property = '-ms-transform';
  } else if (goog.userAgent.WEBKIT) {
    property = '-webkit-transform';
  } else if (goog.userAgent.OPERA) {
    property = '-o-transform';
  } else if (goog.userAgent.GECKO) {
    property = '-moz-transform';
  }
  var transform;
  if (property) {
    transform = goog.style.getStyle_(element, property);
  }
  if (!transform) {
    transform = goog.style.getStyle_(element, 'transform');
  }
  if (!transform) {
    return new goog.math.Coordinate(0, 0);
  }
  var matches = transform.match(goog.style.MATRIX_TRANSLATION_REGEX_);
  if (!matches) {
    return new goog.math.Coordinate(0, 0);
  }
  return new goog.math.Coordinate(parseFloat(matches[1]),
                                  parseFloat(matches[2]));
};
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview File which defines dummy object to work around undefined
 * properties compiler warning for weak dependencies on
 * {@link goog.debug.ErrorHandler#protectEntryPoint}.
 *
 */

goog.provide('goog.debug.errorHandlerWeakDep');


/**
 * Dummy object to work around undefined properties compiler warning.
 * @type {Object}
 */
goog.debug.errorHandlerWeakDep = {
  /**
   * @param {Function} fn An entry point function to be protected.
   * @param {boolean=} opt_tracers Whether to install tracers around the
   *     fn.
   * @return {Function} A protected wrapper function that calls the
   *     entry point function.
   */
  protectEntryPoint: function(fn, opt_tracers) { return fn; }
};
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Listener object.
 * @see ../demos/events.html
 */


/**
 * Namespace for events
 */
goog.provide('goog.events.Listener');



/**
 * Simple class that stores information about a listener
 * @constructor
 */
goog.events.Listener = function() {
  if (goog.events.Listener.ENABLE_MONITORING) {
    this.creationStack = new Error().stack;
  }
};


/**
 * Counter used to create a unique key
 * @type {number}
 * @private
 */
goog.events.Listener.counter_ = 0;


/**
 * @define {boolean} Whether to enable the monitoring of the
 *     goog.events.Listener instances. Switching on the monitoring is only
 *     recommended for debugging because it has a significant impact on
 *     performance and memory usage. If switched off, the monitoring code
 *     compiles down to 0 bytes.
 */
goog.events.Listener.ENABLE_MONITORING = false;


/**
 * Whether the listener is a function or an object that implements handleEvent.
 * @type {boolean}
 * @private
 */
goog.events.Listener.prototype.isFunctionListener_;


/**
 * Call back function or an object with a handleEvent function.
 * @type {Function|Object|null}
 */
goog.events.Listener.prototype.listener;


/**
 * Proxy for callback that passes through {@link goog.events#HandleEvent_}
 * @type {Function}
 */
goog.events.Listener.prototype.proxy;


/**
 * Object or node that callback is listening to
 * @type {Object|goog.events.EventTarget}
 */
goog.events.Listener.prototype.src;


/**
 * Type of event
 * @type {string}
 */
goog.events.Listener.prototype.type;


/**
 * Whether the listener is being called in the capture or bubble phase
 * @type {boolean}
 */
goog.events.Listener.prototype.capture;


/**
 * Optional object whose context to execute the listener in
 * @type {Object|undefined}
 */
goog.events.Listener.prototype.handler;


/**
 * The key of the listener.
 * @type {number}
 */
goog.events.Listener.prototype.key = 0;


/**
 * Whether the listener has been removed.
 * @type {boolean}
 */
goog.events.Listener.prototype.removed = false;


/**
 * Whether to remove the listener after it has been called.
 * @type {boolean}
 */
goog.events.Listener.prototype.callOnce = false;


/**
 * If monitoring the goog.events.Listener instances is enabled, stores the
 * creation stack trace of the Disposable instance.
 * @type {string}
 */
goog.events.Listener.prototype.creationStack;


/**
 * Initializes the listener.
 * @param {Function|Object} listener Callback function, or an object with a
 *     handleEvent function.
 * @param {Function} proxy Wrapper for the listener that patches the event.
 * @param {Object} src Source object for the event.
 * @param {string} type Event type.
 * @param {boolean} capture Whether in capture or bubble phase.
 * @param {Object=} opt_handler Object in whose context to execute the callback.
 */
goog.events.Listener.prototype.init = function(listener, proxy, src, type,
                                               capture, opt_handler) {
  // we do the test of the listener here so that we do  not need to
  // continiously do this inside handleEvent
  if (goog.isFunction(listener)) {
    this.isFunctionListener_ = true;
  } else if (listener && listener.handleEvent &&
      goog.isFunction(listener.handleEvent)) {
    this.isFunctionListener_ = false;
  } else {
    throw Error('Invalid listener argument');
  }

  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false;
};


/**
 * Calls the internal listener
 * @param {Object} eventObject Event object to be passed to listener.
 * @return {boolean} The result of the internal listener call.
 */
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if (this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject);
  }
  return this.listener.handleEvent.call(this.listener, eventObject);
};
// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Browser capability checks for the events package.
 *
 */


goog.provide('goog.events.BrowserFeature');

goog.require('goog.userAgent');


/**
 * Enum of browser capabilities.
 * @enum {boolean}
 */
goog.events.BrowserFeature = {
  /**
   * Whether the button attribute of the event is W3C compliant.  False in
   * Internet Explorer prior to version 9; document-version dependent.
   */
  HAS_W3C_BUTTON: !goog.userAgent.IE || goog.userAgent.isDocumentMode(9),

  /**
   * Whether the browser supports full W3C event model.
   */
  HAS_W3C_EVENT_SUPPORT: !goog.userAgent.IE || goog.userAgent.isDocumentMode(9),

  /**
   * To prevent default in IE7-8 for certain keydown events we need set the
   * keyCode to -1.
   */
  SET_KEY_CODE_TO_PREVENT_DEFAULT: goog.userAgent.IE &&
      !goog.userAgent.isVersion('9'),

  /**
   * Whether the {@code navigator.onLine} property is supported.
   */
  HAS_NAVIGATOR_ONLINE_PROPERTY: !goog.userAgent.WEBKIT ||
      goog.userAgent.isVersion('528'),

  /**
   * Whether HTML5 network online/offline events are supported.
   */
  HAS_HTML5_NETWORK_EVENT_SUPPORT:
      goog.userAgent.GECKO && goog.userAgent.isVersion('1.9b') ||
      goog.userAgent.IE && goog.userAgent.isVersion('8') ||
      goog.userAgent.OPERA && goog.userAgent.isVersion('9.5') ||
      goog.userAgent.WEBKIT && goog.userAgent.isVersion('528'),

  /**
   * Whether HTML5 network events fire on document.body, or otherwise the
   * window.
   */
  HTML5_NETWORK_EVENTS_FIRE_ON_BODY:
      goog.userAgent.GECKO && !goog.userAgent.isVersion('8') ||
      goog.userAgent.IE && !goog.userAgent.isVersion('9'),

  /**
   * Whether touch is enabled in the browser.
   */
  TOUCH_ENABLED:
      ('ontouchstart' in goog.global ||
          !!(goog.global['document'] &&
             document.documentElement &&
             'ontouchstart' in document.documentElement) ||
          // IE10 uses non-standard touch events, so it has a different check.
          !!(goog.global['navigator'] &&
              goog.global['navigator']['msMaxTouchPoints']))
};
// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A global registry for entry points into a program,
 * so that they can be instrumented. Each module should register their
 * entry points with this registry. Designed to be compiled out
 * if no instrumentation is requested.
 *
 * Entry points may be registered before or after a call to
 * goog.debug.entryPointRegistry.monitorAll. If an entry point is registered
 * later, the existing monitor will instrument the new entry point.
 *
 * @author nicksantos@google.com (Nick Santos)
 */

goog.provide('goog.debug.EntryPointMonitor');
goog.provide('goog.debug.entryPointRegistry');

goog.require('goog.asserts');



/**
 * @interface
 */
goog.debug.EntryPointMonitor = function() {};


/**
 * Instruments a function.
 *
 * @param {!Function} fn A function to instrument.
 * @return {!Function} The instrumented function.
 */
goog.debug.EntryPointMonitor.prototype.wrap;


/**
 * Try to remove an instrumentation wrapper created by this monitor.
 * If the function passed to unwrap is not a wrapper created by this
 * monitor, then we will do nothing.
 *
 * Notice that some wrappers may not be unwrappable. For example, if other
 * monitors have applied their own wrappers, then it will be impossible to
 * unwrap them because their wrappers will have captured our wrapper.
 *
 * So it is important that entry points are unwrapped in the reverse
 * order that they were wrapped.
 *
 * @param {!Function} fn A function to unwrap.
 * @return {!Function} The unwrapped function, or {@code fn} if it was not
 *     a wrapped function created by this monitor.
 */
goog.debug.EntryPointMonitor.prototype.unwrap;


/**
 * An array of entry point callbacks.
 * @type {!Array.<function(!Function)>}
 * @private
 */
goog.debug.entryPointRegistry.refList_ = [];


/**
 * Monitors that should wrap all the entry points.
 * @type {!Array.<!goog.debug.EntryPointMonitor>}
 * @private
 */
goog.debug.entryPointRegistry.monitors_ = [];


/**
 * Whether goog.debug.entryPointRegistry.monitorAll has ever been called.
 * Checking this allows the compiler to optimize out the registrations.
 * @type {boolean}
 * @private
 */
goog.debug.entryPointRegistry.monitorsMayExist_ = false;


/**
 * Register an entry point with this module.
 *
 * The entry point will be instrumented when a monitor is passed to
 * goog.debug.entryPointRegistry.monitorAll. If this has already occurred, the
 * entry point is instrumented immediately.
 *
 * @param {function(!Function)} callback A callback function which is called
 *     with a transforming function to instrument the entry point. The callback
 *     is responsible for wrapping the relevant entry point with the
 *     transforming function.
 */
goog.debug.entryPointRegistry.register = function(callback) {
  // Don't use push(), so that this can be compiled out.
  goog.debug.entryPointRegistry.refList_[
      goog.debug.entryPointRegistry.refList_.length] = callback;
  // If no one calls monitorAll, this can be compiled out.
  if (goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for (var i = 0; i < monitors.length; i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]));
    }
  }
};


/**
 * Configures a monitor to wrap all entry points.
 *
 * Entry points that have already been registered are immediately wrapped by
 * the monitor. When an entry point is registered in the future, it will also
 * be wrapped by the monitor when it is registered.
 *
 * @param {!goog.debug.EntryPointMonitor} monitor An entry point monitor.
 */
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for (var i = 0; i < goog.debug.entryPointRegistry.refList_.length; i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer);
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor);
};


/**
 * Try to unmonitor all the entry points that have already been registered. If
 * an entry point is registered in the future, it will not be wrapped by the
 * monitor when it is registered. Note that this may fail if the entry points
 * have additional wrapping.
 *
 * @param {!goog.debug.EntryPointMonitor} monitor The last monitor to wrap
 *     the entry points.
 * @throws {Error} If the monitor is not the most recently configured monitor.
 */
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1],
      'Only the most recent monitor can be unwrapped.');
  var transformer = goog.bind(monitor.unwrap, monitor);
  for (var i = 0; i < goog.debug.entryPointRegistry.refList_.length; i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer);
  }
  monitors.length--;
};
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Definition of the goog.events.EventWrapper interface.
 *
 * @author eae@google.com (Emil A Eklund)
 */

goog.provide('goog.events.EventWrapper');



/**
 * Interface for event wrappers.
 * @interface
 */
goog.events.EventWrapper = function() {
};


/**
 * Adds an event listener using the wrapper on a DOM Node or an object that has
 * implemented {@link goog.events.EventTarget}. A listener can only be added
 * once to an object.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_scope Element in whose scope to call the listener.
 * @param {goog.events.EventHandler=} opt_eventHandler Event handler to add
 *     listener to.
 */
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt,
    opt_scope, opt_eventHandler) {
};


/**
 * Removes an event listener added using goog.events.EventWrapper.listen.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to remove listener
 *    from.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_scope Element in whose scope to call the listener.
 * @param {goog.events.EventHandler=} opt_eventHandler Event handler to remove
 *     listener from.
 */
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt,
    opt_scope, opt_eventHandler) {
};
// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Event Types.
 *
 * @author arv@google.com (Erik Arvidsson)
 * @author mirkov@google.com (Mirko Visontai)
 */


goog.provide('goog.events.EventType');

goog.require('goog.userAgent');


/**
 * Constants for event names.
 * @enum {string}
 */
goog.events.EventType = {
  // Mouse events
  CLICK: 'click',
  DBLCLICK: 'dblclick',
  MOUSEDOWN: 'mousedown',
  MOUSEUP: 'mouseup',
  MOUSEOVER: 'mouseover',
  MOUSEOUT: 'mouseout',
  MOUSEMOVE: 'mousemove',
  SELECTSTART: 'selectstart', // IE, Safari, Chrome

  // Key events
  KEYPRESS: 'keypress',
  KEYDOWN: 'keydown',
  KEYUP: 'keyup',

  // Focus
  BLUR: 'blur',
  FOCUS: 'focus',
  DEACTIVATE: 'deactivate', // IE only
  // NOTE: The following two events are not stable in cross-browser usage.
  //     WebKit and Opera implement DOMFocusIn/Out.
  //     IE implements focusin/out.
  //     Gecko implements neither see bug at
  //     https://bugzilla.mozilla.org/show_bug.cgi?id=396927.
  // The DOM Events Level 3 Draft deprecates DOMFocusIn in favor of focusin:
  //     http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html
  // You can use FOCUS in Capture phase until implementations converge.
  FOCUSIN: goog.userAgent.IE ? 'focusin' : 'DOMFocusIn',
  FOCUSOUT: goog.userAgent.IE ? 'focusout' : 'DOMFocusOut',

  // Forms
  CHANGE: 'change',
  SELECT: 'select',
  SUBMIT: 'submit',
  INPUT: 'input',
  PROPERTYCHANGE: 'propertychange', // IE only

  // Drag and drop
  DRAGSTART: 'dragstart',
  DRAG: 'drag',
  DRAGENTER: 'dragenter',
  DRAGOVER: 'dragover',
  DRAGLEAVE: 'dragleave',
  DROP: 'drop',
  DRAGEND: 'dragend',

  // WebKit touch events.
  TOUCHSTART: 'touchstart',
  TOUCHMOVE: 'touchmove',
  TOUCHEND: 'touchend',
  TOUCHCANCEL: 'touchcancel',

  // Misc
  BEFOREUNLOAD: 'beforeunload',
  CONTEXTMENU: 'contextmenu',
  ERROR: 'error',
  HELP: 'help',
  LOAD: 'load',
  LOSECAPTURE: 'losecapture',
  READYSTATECHANGE: 'readystatechange',
  RESIZE: 'resize',
  SCROLL: 'scroll',
  UNLOAD: 'unload',

  // HTML 5 History events
  // See http://www.w3.org/TR/html5/history.html#event-definitions
  HASHCHANGE: 'hashchange',
  PAGEHIDE: 'pagehide',
  PAGESHOW: 'pageshow',
  POPSTATE: 'popstate',

  // Copy and Paste
  // Support is limited. Make sure it works on your favorite browser
  // before using.
  // http://www.quirksmode.org/dom/events/cutcopypaste.html
  COPY: 'copy',
  PASTE: 'paste',
  CUT: 'cut',
  BEFORECOPY: 'beforecopy',
  BEFORECUT: 'beforecut',
  BEFOREPASTE: 'beforepaste',

  // HTML5 online/offline events.
  // http://www.w3.org/TR/offline-webapps/#related
  ONLINE: 'online',
  OFFLINE: 'offline',

  // HTML 5 worker events
  MESSAGE: 'message',
  CONNECT: 'connect',

  // CSS transition events. Based on the browser support described at:
  // https://developer.mozilla.org/en/css/css_transitions#Browser_compatibility
  TRANSITIONEND: goog.userAgent.WEBKIT ? 'webkitTransitionEnd' :
      (goog.userAgent.OPERA ? 'oTransitionEnd' : 'transitionend'),

  // IE specific events.
  // See http://msdn.microsoft.com/en-us/library/ie/hh673557(v=vs.85).aspx
  MSGESTURECHANGE: 'MSGestureChange',
  MSGESTUREEND: 'MSGestureEnd',
  MSGESTUREHOLD: 'MSGestureHold',
  MSGESTURESTART: 'MSGestureStart',
  MSGESTURETAP: 'MSGestureTap',
  MSINERTIASTART: 'MSInertiaStart',
  MSPOINTERCANCEL: 'MSPointerCancel',
  MSPOINTERDOWN: 'MSPointerDown',
  MSPOINTERMOVE: 'MSPointerMove',
  MSPOINTEROVER: 'MSPointerOver',
  MSPOINTEROUT: 'MSPointerOut',
  MSPOINTERUP: 'MSPointerUp'
};
// Copyright 2011 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Definition of the disposable interface.  A disposable object
 * has a dispose method to to clean up references and resources.
 * @author nnaze@google.com (Nathan Naze)
 */


goog.provide('goog.disposable.IDisposable');



/**
 * Interface for a disposable object.  If a instance requires cleanup
 * (references COM objects, DOM notes, or other disposable objects), it should
 * implement this interface (it may subclass goog.Disposable).
 * @interface
 */
goog.disposable.IDisposable = function() {};


/**
 * Disposes of the object and its resources.
 * @return {void} Nothing.
 */
goog.disposable.IDisposable.prototype.dispose;


/**
 * @return {boolean} Whether the object has been disposed of.
 */
goog.disposable.IDisposable.prototype.isDisposed;
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Implements the disposable interface. The dispose method is used
 * to clean up references and resources.
 * @author arv@google.com (Erik Arvidsson)
 */


goog.provide('goog.Disposable');
goog.provide('goog.dispose');

goog.require('goog.disposable.IDisposable');



/**
 * Class that provides the basic implementation for disposable objects. If your
 * class holds one or more references to COM objects, DOM nodes, or other
 * disposable objects, it should extend this class or implement the disposable
 * interface (defined in goog.disposable.IDisposable).
 * @constructor
 * @implements {goog.disposable.IDisposable}
 */
goog.Disposable = function() {
  if (goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF) {
    this.creationStack = new Error().stack;
    goog.Disposable.instances_[goog.getUid(this)] = this;
  }
};


/**
 * @enum {number} Different monitoring modes for Disposable.
 */
goog.Disposable.MonitoringMode = {
  /**
   * No monitoring.
   */
  OFF: 0,
  /**
   * Creating and disposing the goog.Disposable instances is monitored. All
   * disposable objects need to call the {@code goog.Disposable} base
   * constructor. The PERMANENT mode must bet switched on before creating any
   * goog.Disposable instances.
   */
  PERMANENT: 1,
  /**
   * INTERACTIVE mode can be switched on and off on the fly without producing
   * errors. It also doesn't warn if the disposable objects don't call the
   * {@code goog.Disposable} base constructor.
   */
  INTERACTIVE: 2
};


/**
 * @define {number} The monitoring mode of the goog.Disposable
 *     instances. Default is OFF. Switching on the monitoring is only
 *     recommended for debugging because it has a significant impact on
 *     performance and memory usage. If switched off, the monitoring code
 *     compiles down to 0 bytes.
 */
goog.Disposable.MONITORING_MODE = 0;


/**
 * Maps the unique ID of every undisposed {@code goog.Disposable} object to
 * the object itself.
 * @type {!Object.<number, !goog.Disposable>}
 * @private
 */
goog.Disposable.instances_ = {};


/**
 * @return {!Array.<!goog.Disposable>} All {@code goog.Disposable} objects that
 *     haven't been disposed of.
 */
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for (var id in goog.Disposable.instances_) {
    if (goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)]);
    }
  }
  return ret;
};


/**
 * Clears the registry of undisposed objects but doesn't dispose of them.
 */
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {};
};


/**
 * Whether the object has been disposed of.
 * @type {boolean}
 * @private
 */
goog.Disposable.prototype.disposed_ = false;


/**
 * Disposables that should be disposed when this object is disposed.
 * @type {Array.<goog.disposable.IDisposable>}
 * @private
 */
goog.Disposable.prototype.dependentDisposables_;


/**
 * Callbacks to invoke when this object is disposed.
 * @type {Array.<!Function>}
 * @private
 */
goog.Disposable.prototype.onDisposeCallbacks_;


/**
 * If monitoring the goog.Disposable instances is enabled, stores the creation
 * stack trace of the Disposable instance.
 * @type {string}
 */
goog.Disposable.prototype.creationStack;


/**
 * @return {boolean} Whether the object has been disposed of.
 * @override
 */
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_;
};


/**
 * @return {boolean} Whether the object has been disposed of.
 * @deprecated Use {@link #isDisposed} instead.
 */
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;


/**
 * Disposes of the object. If the object hasn't already been disposed of, calls
 * {@link #disposeInternal}. Classes that extend {@code goog.Disposable} should
 * override {@link #disposeInternal} in order to delete references to COM
 * objects, DOM nodes, and other disposable objects. Reentrant.
 *
 * @return {void} Nothing.
 * @override
 */
goog.Disposable.prototype.dispose = function() {
  if (!this.disposed_) {
    // Set disposed_ to true first, in case during the chain of disposal this
    // gets disposed recursively.
    this.disposed_ = true;
    this.disposeInternal();
    if (goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF) {
      var uid = goog.getUid(this);
      if (goog.Disposable.MONITORING_MODE ==
          goog.Disposable.MonitoringMode.PERMANENT &&
          !goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + ' did not call the goog.Disposable base ' +
            'constructor or was disposed of after a clearUndisposedObjects ' +
            'call');
      }
      delete goog.Disposable.instances_[uid];
    }
  }
};


/**
 * Associates a disposable object with this object so that they will be disposed
 * together.
 * @param {goog.disposable.IDisposable} disposable that will be disposed when
 *     this object is disposed.
 */
goog.Disposable.prototype.registerDisposable = function(disposable) {
  if (!this.dependentDisposables_) {
    this.dependentDisposables_ = [];
  }
  this.dependentDisposables_.push(disposable);
};


/**
 * Invokes a callback function when this object is disposed. Callbacks are
 * invoked in the order in which they were added.
 * @param {function(this:T):?} callback The callback function.
 * @param {T=} opt_scope An optional scope to call the callback in.
 * @template T
 */
goog.Disposable.prototype.addOnDisposeCallback = function(callback, opt_scope) {
  if (!this.onDisposeCallbacks_) {
    this.onDisposeCallbacks_ = [];
  }
  this.onDisposeCallbacks_.push(goog.bind(callback, opt_scope));
};


/**
 * Deletes or nulls out any references to COM objects, DOM nodes, or other
 * disposable objects. Classes that extend {@code goog.Disposable} should
 * override this method.
 * Not reentrant. To avoid calling it twice, it must only be called from the
 * subclass' {@code disposeInternal} method. Everywhere else the public
 * {@code dispose} method must be used.
 * For example:
 * <pre>
 *   mypackage.MyClass = function() {
 *     goog.base(this);
 *     // Constructor logic specific to MyClass.
 *     ...
 *   };
 *   goog.inherits(mypackage.MyClass, goog.Disposable);
 *
 *   mypackage.MyClass.prototype.disposeInternal = function() {
 *     // Dispose logic specific to MyClass.
 *     ...
 *     // Call superclass's disposeInternal at the end of the subclass's, like
 *     // in C++, to avoid hard-to-catch issues.
 *     goog.base(this, 'disposeInternal');
 *   };
 * </pre>
 * @protected
 */
goog.Disposable.prototype.disposeInternal = function() {
  if (this.dependentDisposables_) {
    goog.disposeAll.apply(null, this.dependentDisposables_);
  }
  if (this.onDisposeCallbacks_) {
    while (this.onDisposeCallbacks_.length) {
      this.onDisposeCallbacks_.shift()();
    }
  }
};


/**
 * Returns True if we can verify the object is disposed.
 * Calls {@code isDisposed} on the argument if it supports it.  If obj
 * is not an object with an isDisposed() method, return false.
 * @param {*} obj The object to investigate.
 * @return {boolean} True if we can verify the object is disposed.
 */
goog.Disposable.isDisposed = function(obj) {
  if (obj && typeof obj.isDisposed == 'function') {
    return obj.isDisposed();
  }
  return false;
};


/**
 * Calls {@code dispose} on the argument if it supports it. If obj is not an
 *     object with a dispose() method, this is a no-op.
 * @param {*} obj The object to dispose of.
 */
goog.dispose = function(obj) {
  if (obj && typeof obj.dispose == 'function') {
    obj.dispose();
  }
};


/**
 * Calls {@code dispose} on each member of the list that supports it. (If the
 * member is an ArrayLike, then {@code goog.disposeAll()} will be called
 * recursively on each of its members.) If the member is not an object with a
 * {@code dispose()} method, then it is ignored.
 * @param {...*} var_args The list.
 */
goog.disposeAll = function(var_args) {
  for (var i = 0, len = arguments.length; i < len; ++i) {
    var disposable = arguments[i];
    if (goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable);
    } else {
      goog.dispose(disposable);
    }
  }
};
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A base class for event objects.
 *
 */


goog.provide('goog.events.Event');

// goog.events.Event no longer depends on goog.Disposable. Keep requiring
// goog.Disposable here to not break projects which assume this dependency.
goog.require('goog.Disposable');



/**
 * A base class for event objects, so that they can support preventDefault and
 * stopPropagation.
 *
 * @param {string} type Event Type.
 * @param {Object=} opt_target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @constructor
 */
goog.events.Event = function(type, opt_target) {
  /**
   * Event type.
   * @type {string}
   */
  this.type = type;

  /**
   * Target of the event.
   * @type {Object|undefined}
   */
  this.target = opt_target;

  /**
   * Object that had the listener attached.
   * @type {Object|undefined}
   */
  this.currentTarget = this.target;
};


/**
 * For backwards compatibility (goog.events.Event used to inherit
 * goog.Disposable).
 * @deprecated Events don't need to be disposed.
 */
goog.events.Event.prototype.disposeInternal = function() {
};


/**
 * For backwards compatibility (goog.events.Event used to inherit
 * goog.Disposable).
 * @deprecated Events don't need to be disposed.
 */
goog.events.Event.prototype.dispose = function() {
};


/**
 * Whether to cancel the event in internal capture/bubble processing for IE.
 * @type {boolean}
 * @suppress {underscore} Technically public, but referencing this outside
 *     this package is strongly discouraged.
 */
goog.events.Event.prototype.propagationStopped_ = false;


/**
 * Whether the default action has been prevented.
 * This is a property to match the W3C specification at {@link
 * http://www.w3.org/TR/DOM-Level-3-Events/#events-event-type-defaultPrevented}.
 * Must be treated as read-only outside the class.
 * @type {boolean}
 */
goog.events.Event.prototype.defaultPrevented = false;


/**
 * Return value for in internal capture/bubble processing for IE.
 * @type {boolean}
 * @suppress {underscore} Technically public, but referencing this outside
 *     this package is strongly discouraged.
 */
goog.events.Event.prototype.returnValue_ = true;


/**
 * Stops event propagation.
 */
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true;
};


/**
 * Prevents the default action, for example a link redirecting to a url.
 */
goog.events.Event.prototype.preventDefault = function() {
  this.defaultPrevented = true;
  this.returnValue_ = false;
};


/**
 * Stops the propagation of the event. It is equivalent to
 * {@code e.stopPropagation()}, but can be used as the callback argument of
 * {@link goog.events.listen} without declaring another function.
 * @param {!goog.events.Event} e An event.
 */
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation();
};


/**
 * Prevents the default action. It is equivalent to
 * {@code e.preventDefault()}, but can be used as the callback argument of
 * {@link goog.events.listen} without declaring another function.
 * @param {!goog.events.Event} e An event.
 */
goog.events.Event.preventDefault = function(e) {
  e.preventDefault();
};
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Useful compiler idioms.
 *
 */

goog.provide('goog.reflect');


/**
 * Syntax for object literal casts.
 * @see http://go/jscompiler-renaming
 * @see http://code.google.com/p/closure-compiler/wiki/
 *      ExperimentalTypeBasedPropertyRenaming
 *
 * Use this if you have an object literal whose keys need to have the same names
 * as the properties of some class even after they are renamed by the compiler.
 *
 * @param {!Function} type Type to cast to.
 * @param {Object} object Object literal to cast.
 * @return {Object} The object literal.
 */
goog.reflect.object = function(type, object) {
  return object;
};


/**
 * To assert to the compiler that an operation is needed when it would
 * otherwise be stripped. For example:
 * <code>
 *     // Force a layout
 *     goog.reflect.sinkValue(dialog.offsetHeight);
 * </code>
 * @type {!Function}
 */
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[' '](x);
  return x;
};


/**
 * The compiler should optimize this function away iff no one ever uses
 * goog.reflect.sinkValue.
 */
goog.reflect.sinkValue[' '] = goog.nullFunction;


/**
 * Check if a property can be accessed without throwing an exception.
 * @param {Object} obj The owner of the property.
 * @param {string} prop The property name.
 * @return {boolean} Whether the property is accessible. Will also return true
 *     if obj is null.
 */
goog.reflect.canAccessProperty = function(obj, prop) {
  /** @preserveTry */
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true;
  } catch (e) {}
  return false;
};
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A patched, standardized event object for browser events.
 *
 * <pre>
 * The patched event object contains the following members:
 * - type           {string}    Event type, e.g. 'click'
 * - timestamp      {Date}      A date object for when the event was fired
 * - target         {Object}    The element that actually triggered the event
 * - currentTarget  {Object}    The element the listener is attached to
 * - relatedTarget  {Object}    For mouseover and mouseout, the previous object
 * - offsetX        {number}    X-coordinate relative to target
 * - offsetY        {number}    Y-coordinate relative to target
 * - clientX        {number}    X-coordinate relative to viewport
 * - clientY        {number}    Y-coordinate relative to viewport
 * - screenX        {number}    X-coordinate relative to the edge of the screen
 * - screenY        {number}    Y-coordinate relative to the edge of the screen
 * - button         {number}    Mouse button. Use isButton() to test.
 * - keyCode        {number}    Key-code
 * - ctrlKey        {boolean}   Was ctrl key depressed
 * - altKey         {boolean}   Was alt key depressed
 * - shiftKey       {boolean}   Was shift key depressed
 * - metaKey        {boolean}   Was meta key depressed
 * - defaultPrevented {boolean} Whether the default action has been prevented
 * - state          {Object}    History state object
 *
 * NOTE: The keyCode member contains the raw browser keyCode. For normalized
 * key and character code use {@link goog.events.KeyHandler}.
 * </pre>
 *
 */

goog.provide('goog.events.BrowserEvent');
goog.provide('goog.events.BrowserEvent.MouseButton');

goog.require('goog.events.BrowserFeature');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.reflect');
goog.require('goog.userAgent');



/**
 * Accepts a browser event object and creates a patched, cross browser event
 * object.
 * The content of this object will not be initialized if no event object is
 * provided. If this is the case, init() needs to be invoked separately.
 * @param {Event=} opt_e Browser event object.
 * @param {Node=} opt_currentTarget Current target for event.
 * @constructor
 * @extends {goog.events.Event}
 */
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if (opt_e) {
    this.init(opt_e, opt_currentTarget);
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);


/**
 * Normalized button constants for the mouse.
 * @enum {number}
 */
goog.events.BrowserEvent.MouseButton = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2
};


/**
 * Static data for mapping mouse buttons.
 * @type {Array.<number>}
 */
goog.events.BrowserEvent.IEButtonMap = [
  1, // LEFT
  4, // MIDDLE
  2  // RIGHT
];


/**
 * Target that fired the event.
 * @override
 * @type {Node}
 */
goog.events.BrowserEvent.prototype.target = null;


/**
 * Node that had the listener attached.
 * @override
 * @type {Node|undefined}
 */
goog.events.BrowserEvent.prototype.currentTarget;


/**
 * For mouseover and mouseout events, the related object for the event.
 * @type {Node}
 */
goog.events.BrowserEvent.prototype.relatedTarget = null;


/**
 * X-coordinate relative to target.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.offsetX = 0;


/**
 * Y-coordinate relative to target.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.offsetY = 0;


/**
 * X-coordinate relative to the window.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.clientX = 0;


/**
 * Y-coordinate relative to the window.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.clientY = 0;


/**
 * X-coordinate relative to the monitor.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.screenX = 0;


/**
 * Y-coordinate relative to the monitor.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.screenY = 0;


/**
 * Which mouse button was pressed.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.button = 0;


/**
 * Keycode of key press.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.keyCode = 0;


/**
 * Keycode of key press.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.charCode = 0;


/**
 * Whether control was pressed at time of event.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.ctrlKey = false;


/**
 * Whether alt was pressed at time of event.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.altKey = false;


/**
 * Whether shift was pressed at time of event.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.shiftKey = false;


/**
 * Whether the meta key was pressed at time of event.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.metaKey = false;


/**
 * History state object, only set for PopState events where it's a copy of the
 * state object provided to pushState or replaceState.
 * @type {Object}
 */
goog.events.BrowserEvent.prototype.state;


/**
 * Whether the default platform modifier key was pressed at time of event.
 * (This is control for all platforms except Mac, where it's Meta.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.platformModifierKey = false;


/**
 * The browser event object.
 * @type {Event}
 * @private
 */
goog.events.BrowserEvent.prototype.event_ = null;


/**
 * Accepts a browser event object and creates a patched, cross browser event
 * object.
 * @param {Event} e Browser event object.
 * @param {Node=} opt_currentTarget Current target for event.
 */
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);

  // TODO(nicksantos): Change this.target to type EventTarget.
  this.target = /** @type {Node} */ (e.target) || e.srcElement;

  this.currentTarget = opt_currentTarget;

  var relatedTarget = /** @type {Node} */ (e.relatedTarget);
  if (relatedTarget) {
    // There's a bug in FireFox where sometimes, relatedTarget will be a
    // chrome element, and accessing any property of it will get a permission
    // denied exception. See:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=497780
    if (goog.userAgent.GECKO) {
      if (!goog.reflect.canAccessProperty(relatedTarget, 'nodeName')) {
        relatedTarget = null;
      }
    }
    // TODO(arv): Use goog.events.EventType when it has been refactored into its
    // own file.
  } else if (type == goog.events.EventType.MOUSEOVER) {
    relatedTarget = e.fromElement;
  } else if (type == goog.events.EventType.MOUSEOUT) {
    relatedTarget = e.toElement;
  }

  this.relatedTarget = relatedTarget;

  // Webkit emits a lame warning whenever layerX/layerY is accessed.
  // http://code.google.com/p/chromium/issues/detail?id=101733
  this.offsetX = (goog.userAgent.WEBKIT || e.offsetX !== undefined) ?
      e.offsetX : e.layerX;
  this.offsetY = (goog.userAgent.WEBKIT || e.offsetY !== undefined) ?
      e.offsetY : e.layerY;

  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;

  this.button = e.button;

  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == 'keypress' ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  if (e.defaultPrevented) {
    this.preventDefault();
  }
  delete this.propagationStopped_;
};


/**
 * Tests to see which button was pressed during the event. This is really only
 * useful in IE and Gecko browsers. And in IE, it's only useful for
 * mousedown/mouseup events, because click only fires for the left mouse button.
 *
 * Safari 2 only reports the left button being clicked, and uses the value '1'
 * instead of 0. Opera only reports a mousedown event for the middle button, and
 * no mouse events for the right button. Opera has default behavior for left and
 * middle click that can only be overridden via a configuration setting.
 *
 * There's a nice table of this mess at http://www.unixpapa.com/js/mouse.html.
 *
 * @param {goog.events.BrowserEvent.MouseButton} button The button
 *     to test for.
 * @return {boolean} True if button was pressed.
 */
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if (!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if (this.type == 'click') {
      return button == goog.events.BrowserEvent.MouseButton.LEFT;
    } else {
      return !!(this.event_.button &
          goog.events.BrowserEvent.IEButtonMap[button]);
    }
  } else {
    return this.event_.button == button;
  }
};


/**
 * Whether this has an "action"-producing mouse button.
 *
 * By definition, this includes left-click on windows/linux, and left-click
 * without the ctrl key on Macs.
 *
 * @return {boolean} The result.
 */
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  // Webkit does not ctrl+click to be a right-click, so we
  // normalize it to behave like Gecko and Opera.
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) &&
      !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey);
};


/**
 * @override
 */
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if (this.event_.stopPropagation) {
    this.event_.stopPropagation();
  } else {
    this.event_.cancelBubble = true;
  }
};


/**
 * @override
 */
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if (!be.preventDefault) {
    be.returnValue = false;
    if (goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      /** @preserveTry */
      try {
        // Most keys can be prevented using returnValue. Some special keys
        // require setting the keyCode to -1 as well:
        //
        // In IE7:
        // F3, F5, F10, F11, Ctrl+P, Crtl+O, Ctrl+F (these are taken from IE6)
        //
        // In IE8:
        // Ctrl+P, Crtl+O, Ctrl+F (F1-F12 cannot be stopped through the event)
        //
        // We therefore do this for all function keys as well as when Ctrl key
        // is pressed.
        var VK_F1 = 112;
        var VK_F12 = 123;
        if (be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1;
        }
      } catch (ex) {
        // IE throws an 'access denied' exception when trying to change
        // keyCode in some situations (e.g. srcElement is input[type=file],
        // or srcElement is an anchor tag rewritten by parent's innerHTML).
        // Do nothing in this case.
      }
    }
  } else {
    be.preventDefault();
  }
};


/**
 * @return {Event} The underlying browser event object.
 */
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_;
};


/** @override */
goog.events.BrowserEvent.prototype.disposeInternal = function() {
};
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Event Manager.
 *
 * Provides an abstracted interface to the browsers' event
 * systems. This uses an indirect lookup of listener functions to avoid circular
 * references between DOM (in IE) or XPCOM (in Mozilla) objects which leak
 * memory. This makes it easier to write OO Javascript/DOM code.
 *
 * It simulates capture & bubble in Internet Explorer.
 *
 * The listeners will also automagically have their event objects patched, so
 * your handlers don't need to worry about the browser.
 *
 * Example usage:
 * <pre>
 * goog.events.listen(myNode, 'click', function(e) { alert('woo') });
 * goog.events.listen(myNode, 'mouseover', mouseHandler, true);
 * goog.events.unlisten(myNode, 'mouseover', mouseHandler, true);
 * goog.events.removeAll(myNode);
 * goog.events.removeAll();
 * </pre>
 *
 *                                            in IE and event object patching]
 *
 * @supported IE6+, FF1.5+, WebKit, Opera.
 * @see ../demos/events.html
 * @see ../demos/event-propagation.html
 * @see ../demos/stopevent.html
 */


// This uses 3 lookup tables/trees.
// listenerTree_ is a tree of type -> capture -> src uid -> [Listener]
// listeners_ is a map of key -> [Listener]
//
// The key is a field of the Listener. The Listener class also has the type,
// capture and the src so one can always trace back in the tree
//
// sources_: src uid -> [Listener]


goog.provide('goog.events');

goog.require('goog.array');
goog.require('goog.debug.entryPointRegistry');
goog.require('goog.debug.errorHandlerWeakDep');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.BrowserFeature');
goog.require('goog.events.Event');
goog.require('goog.events.EventWrapper');
goog.require('goog.events.Listener');
goog.require('goog.object');
goog.require('goog.userAgent');


/**
 * Container for storing event listeners and their proxies
 * @private
 * @type {Object.<goog.events.Listener>}
 */
goog.events.listeners_ = {};


/**
 * The root of the listener tree
 * @private
 * @type {Object}
 */
goog.events.listenerTree_ = {};


/**
 * Lookup for mapping source UIDs to listeners.
 * @private
 * @type {Object}
 */
goog.events.sources_ = {};


/**
 * String used to prepend to IE event types.  Not a constant so that it is not
 * inlined.
 * @type {string}
 * @private
 */
goog.events.onString_ = 'on';


/**
 * Map of computed on strings for IE event types. Caching this removes an extra
 * object allocation in goog.events.listen which improves IE6 performance.
 * @type {Object}
 * @private
 */
goog.events.onStringMap_ = {};


/**
 * Separator used to split up the various parts of an event key, to help avoid
 * the possibilities of collisions.
 * @type {string}
 * @private
 */
goog.events.keySeparator_ = '_';


/**
 * Adds an event listener for a specific event on a DOM Node or an object that
 * has implemented {@link goog.events.EventTarget}. A listener can only be
 * added once to an object and if it is added again the key for the listener
 * is returned.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {string|Array.<string>} type Event type or array of event types.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {?number} Unique key for the listener.
 */
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if (!type) {
    throw Error('Invalid event type');
  } else if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.listen(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  } else {
    var capture = !!opt_capt;
    var map = goog.events.listenerTree_;

    if (!(type in map)) {
      map[type] = {count_: 0, remaining_: 0};
    }
    map = map[type];

    if (!(capture in map)) {
      map[capture] = {count_: 0, remaining_: 0};
      map.count_++;
    }
    map = map[capture];

    var srcUid = goog.getUid(src);
    var listenerArray, listenerObj;

    // The remaining_ property is used to be able to short circuit the iteration
    // of the event listeners.
    //
    // Increment the remaining event listeners to call even if this event might
    // already have been fired. At this point we do not know if the event has
    // been fired and it is too expensive to find out. By incrementing it we are
    // guaranteed that we will not skip any event listeners.
    map.remaining_++;

    // Do not use srcUid in map here since that will cast the number to a
    // string which will allocate one string object.
    if (!map[srcUid]) {
      listenerArray = map[srcUid] = [];
      map.count_++;
    } else {
      listenerArray = map[srcUid];
      // Ensure that the listeners do not already contain the current listener
      for (var i = 0; i < listenerArray.length; i++) {
        listenerObj = listenerArray[i];
        if (listenerObj.listener == listener &&
            listenerObj.handler == opt_handler) {

          // If this listener has been removed we should not return its key. It
          // is OK that we create new listenerObj below since the removed one
          // will be cleaned up later.
          if (listenerObj.removed) {
            break;
          }

          // We already have this listener. Return its key.
          return listenerArray[i].key;
        }
      }
    }

    var proxy = goog.events.getProxy();
    proxy.src = src;
    listenerObj = new goog.events.Listener();
    listenerObj.init(listener, proxy, src, type, capture, opt_handler);
    var key = listenerObj.key;
    proxy.key = key;

    listenerArray.push(listenerObj);
    goog.events.listeners_[key] = listenerObj;

    if (!goog.events.sources_[srcUid]) {
      goog.events.sources_[srcUid] = [];
    }
    goog.events.sources_[srcUid].push(listenerObj);


    // Attach the proxy through the browser's API
    if (src.addEventListener) {
      if (src == goog.global || !src.customEvent_) {
        src.addEventListener(type, proxy, capture);
      }
    } else {
      // The else above used to be else if (src.attachEvent) and then there was
      // another else statement that threw an exception warning the developer
      // they made a mistake. This resulted in an extra object allocation in IE6
      // due to a wrapper object that had to be implemented around the element
      // and so was removed.
      src.attachEvent(goog.events.getOnString_(type), proxy);
    }

    return key;
  }
};


/**
 * Helper function for returning a proxy function.
 * @return {Function} A new or reused function object.
 */
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  // Use a local var f to prevent one allocation.
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ?
      function(eventObject) {
        return proxyCallbackFunction.call(f.src, f.key, eventObject);
      } :
      function(eventObject) {
        var v = proxyCallbackFunction.call(f.src, f.key, eventObject);
        // NOTE(user): In IE, we hack in a capture phase. However, if
        // there is inline event handler which tries to prevent default (for
        // example <a href="..." onclick="return false">...</a>) in a
        // descendant element, the prevent default will be overridden
        // by this listener if this listener were to return true. Hence, we
        // return undefined.
        if (!v) return v;
      };
  return f;
};


/**
 * Adds an event listener for a specific event on a DomNode or an object that
 * has implemented {@link goog.events.EventTarget}. After the event has fired
 * the event listener is removed from the target.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {string|Array.<string>} type Event type or array of event types.
 * @param {Function|Object} listener Callback method.
 * @param {boolean=} opt_capt Fire in capture phase?.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {?number} Unique key for the listener.
 */
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  }

  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key;
};


/**
 * Adds an event listener with a specific event wrapper on a DOM Node or an
 * object that has implemented {@link goog.events.EventTarget}. A listener can
 * only be added once to an object.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {goog.events.EventWrapper} wrapper Event wrapper to use.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 */
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt,
    opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler);
};


/**
 * Removes an event listener which was added with listen().
 *
 * @param {EventTarget|goog.events.EventTarget} src The target to stop
 *     listening to events on.
 * @param {string|Array.<string>} type The name of the event without the 'on'
 *     prefix.
 * @param {Function|Object} listener The listener function to remove.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase of the
 *     event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {?boolean} indicating whether the listener was there to remove.
 */
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  }

  var capture = !!opt_capt;

  var listenerArray = goog.events.getListeners_(src, type, capture);
  if (!listenerArray) {
    return false;
  }

  for (var i = 0; i < listenerArray.length; i++) {
    if (listenerArray[i].listener == listener &&
        listenerArray[i].capture == capture &&
        listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key);
    }
  }

  return false;
};


/**
 * Removes an event listener which was added with listen() by the key
 * returned by listen().
 *
 * @param {?number} key The key returned by listen() for this event listener.
 * @return {boolean} indicating whether the listener was there to remove.
 */
goog.events.unlistenByKey = function(key) {
  // Do not use key in listeners here since that will cast the number to a
  // string which will allocate one string object.
  if (!goog.events.listeners_[key]) {
    return false;
  }
  var listener = goog.events.listeners_[key];

  if (listener.removed) {
    return false;
  }

  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;

  if (src.removeEventListener) {
    // EventTarget calls unlisten so we need to ensure that the source is not
    // an event target to prevent re-entry.
    // TODO(arv): What is this goog.global for? Why would anyone listen to
    // events on the [[Global]] object? Is it supposed to be window? Why would
    // we not want to allow removing event listeners on the window?
    if (src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture);
    }
  } else if (src.detachEvent) {
    src.detachEvent(goog.events.getOnString_(type), proxy);
  }

  var srcUid = goog.getUid(src);

  // In a perfect implementation we would decrement the remaining_ field here
  // but then we would need to know if the listener has already been fired or
  // not. We therefore skip doing this and in this uncommon case the entire
  // ancestor chain will need to be traversed as before.

  // Remove from sources_
  if (goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if (sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid];
    }
  }

  listener.removed = true;

  // There are some esoteric situations where the hash code of an object
  // can change, and we won't be able to find the listenerArray anymore.
  // For example, if you're listening on a window, and the user navigates to
  // a different window, the UID will disappear.
  //
  // It should be impossible to ever find the original listenerArray, so it
  // doesn't really matter if we can't clean it up in this case.
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if (listenerArray) {
    listenerArray.needsCleanup_ = true;
    goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  }

  delete goog.events.listeners_[key];

  return true;
};


/**
 * Removes an event listener which was added with listenWithWrapper().
 *
 * @param {EventTarget|goog.events.EventTarget} src The target to stop
 *     listening to events on.
 * @param {goog.events.EventWrapper} wrapper Event wrapper to use.
 * @param {Function|Object} listener The listener function to remove.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase of the
 *     event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 */
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt,
    opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler);
};


/**
 * Cleans up the listener array as well as the listener tree
 * @param {string} type  The type of the event.
 * @param {boolean} capture Whether to clean up capture phase listeners instead
 *     bubble phase listeners.
 * @param {number} srcUid  The unique ID of the source.
 * @param {Array.<goog.events.Listener>} listenerArray The array being cleaned.
 * @private
 */
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  // The listener array gets locked during the dispatch phase so that removals
  // of listeners during this phase does not screw up the indeces. This method
  // is called after we have removed a listener as well as after the dispatch
  // phase in case any listeners were removed.
  if (!listenerArray.locked_) { // catches both 0 and not set
    if (listenerArray.needsCleanup_) {
      // Loop over the listener array and remove listeners that have removed set
      // to true. This could have been done with filter or something similar but
      // we want to change the array in place and we want to minimize
      // allocations. Adding a listener during this phase adds to the end of the
      // array so that works fine as long as the length is rechecked every in
      // iteration.
      for (var oldIndex = 0, newIndex = 0;
           oldIndex < listenerArray.length;
           oldIndex++) {
        if (listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          continue;
        }
        if (oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex];
        }
        newIndex++;
      }
      listenerArray.length = newIndex;

      listenerArray.needsCleanup_ = false;

      // In case the length is now zero we release the object.
      if (newIndex == 0) {
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;

        if (goog.events.listenerTree_[type][capture].count_ == 0) {
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--;
        }

        if (goog.events.listenerTree_[type].count_ == 0) {
          delete goog.events.listenerTree_[type];
        }
      }

    }
  }
};


/**
 * Removes all listeners from an object, if no object is specified it will
 * remove all listeners that have been registered.  You can also optionally
 * remove listeners of a particular type or capture phase.
 *
 * @param {Object=} opt_obj Object to remove listeners from.
 * @param {string=} opt_type Type of event to, default is all types.
 * @param {boolean=} opt_capt Whether to remove the listeners from the capture
 *     or bubble phase.  If unspecified, will remove both.
 * @return {number} Number of listeners removed.
 */
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;

  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;

  if (!noObj) {
    var srcUid = goog.getUid(/** @type {Object} */ (opt_obj));
    if (goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for (var i = sourcesArray.length - 1; i >= 0; i--) {
        var listener = sourcesArray[i];
        if ((noType || opt_type == listener.type) &&
            (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++;
        }
      }
    }
  } else {
    // Loop over the sources_ map instead of over the listeners_ since it is
    // smaller which results in fewer allocations.
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for (var i = listeners.length - 1; i >= 0; i--) {
        var listener = listeners[i];
        if ((noType || opt_type == listener.type) &&
            (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++;
        }
      }
    });
  }

  return count;
};


/**
 * Gets the listeners for a given object, type and capture phase.
 *
 * @param {Object} obj Object to get listeners for.
 * @param {string} type Event type.
 * @param {boolean} capture Capture phase?.
 * @return {Array.<goog.events.Listener>} Array of listener objects.
 */
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || [];
};


/**
 * Gets the listeners for a given object, type and capture phase.
 *
 * @param {Object} obj Object to get listeners for.
 * @param {?string} type Event type.
 * @param {boolean} capture Capture phase?.
 * @return {Array.<goog.events.Listener>?} Array of listener objects.
 *     Returns null if object has no listeners of that type.
 * @private
 */
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if (type in map) {
    map = map[type];
    if (capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if (map[objUid]) {
        return map[objUid];
      }
    }
  }

  return null;
};


/**
 * Gets the goog.events.Listener for the event or null if no such listener is
 * in use.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node from which to get
 *     listeners.
 * @param {?string} type The name of the event without the 'on' prefix.
 * @param {Function|Object} listener The listener function to get.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *                            whether the listener is fired during the
 *                            capture or bubble phase of the event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {goog.events.Listener?} the found listener or null if not found.
 */
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if (listenerArray) {
    for (var i = 0; i < listenerArray.length; i++) {
      // If goog.events.unlistenByKey is called during an event dispatch
      // then the listener array won't get cleaned up and there might be
      // 'removed' listeners in the list. Ignore those.
      if (!listenerArray[i].removed &&
          listenerArray[i].listener == listener &&
          listenerArray[i].capture == capture &&
          listenerArray[i].handler == opt_handler) {
        // We already have this listener. Return its key.
        return listenerArray[i];
      }
    }
  }
  return null;
};


/**
 * Returns whether an event target has any active listeners matching the
 * specified signature. If either the type or capture parameters are
 * unspecified, the function will match on the remaining criteria.
 *
 * @param {EventTarget|goog.events.EventTarget} obj Target to get listeners for.
 * @param {string=} opt_type Event type.
 * @param {boolean=} opt_capture Whether to check for capture or bubble-phase
 *     listeners.
 * @return {boolean} Whether an event target has one or more listeners matching
 *     the requested type and/or capture phase.
 */
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];

  if (listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);

    if (hasType && hasCapture) {
      // Lookup in the listener tree whether the specified listener exists.
      var map = goog.events.listenerTree_[opt_type];
      return !!map && !!map[opt_capture] && objUid in map[opt_capture];

    } else if (!(hasType || hasCapture)) {
      // Simple check for whether the event target has any listeners at all.
      return true;

    } else {
      // Iterate through the listeners for the event target to find a match.
      return goog.array.some(listeners, function(listener) {
        return (hasType && listener.type == opt_type) ||
               (hasCapture && listener.capture == opt_capture);
      });
    }
  }

  return false;
};


/**
 * Provides a nice string showing the normalized event objects public members
 * @param {Object} e Event Object.
 * @return {string} String of the public members of the normalized event object.
 */
goog.events.expose = function(e) {
  var str = [];
  for (var key in e) {
    if (e[key] && e[key].id) {
      str.push(key + ' = ' + e[key] + ' (' + e[key].id + ')');
    } else {
      str.push(key + ' = ' + e[key]);
    }
  }
  return str.join('\n');
};


/**
 * Returns a string wth on prepended to the specified type. This is used for IE
 * which expects "on" to be prepended. This function caches the string in order
 * to avoid extra allocations in steady state.
 * @param {string} type Event type strng.
 * @return {string} The type string with 'on' prepended.
 * @private
 */
goog.events.getOnString_ = function(type) {
  if (type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type];
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type;
};


/**
 * Fires an object's listeners of a particular type and phase
 *
 * @param {Object} obj Object whose listeners to call.
 * @param {string} type Event type.
 * @param {boolean} capture Which event phase.
 * @param {Object} eventObject Event object to be passed to listener.
 * @return {boolean} True if all listeners returned true else false.
 */
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if (type in map) {
    map = map[type];
    if (capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type,
                                        capture, eventObject);
    }
  }
  return true;
};


/**
 * Fires an object's listeners of a particular type and phase.
 *
 * @param {Object} map Object with listeners in it.
 * @param {Object} obj Object whose listeners to call.
 * @param {string} type Event type.
 * @param {boolean} capture Which event phase.
 * @param {Object} eventObject Event object to be passed to listener.
 * @return {boolean} True if all listeners returned true else false.
 * @private
 */
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;

  var objUid = goog.getUid(obj);
  if (map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];

    // If locked_ is not set (and if already 0) initialize it to 1.
    if (!listenerArray.locked_) {
      listenerArray.locked_ = 1;
    } else {
      listenerArray.locked_++;
    }

    try {
      // Events added in the dispatch phase should not be dispatched in
      // the current dispatch phase. They will be included in the next
      // dispatch phase though.
      var length = listenerArray.length;
      for (var i = 0; i < length; i++) {
        var listener = listenerArray[i];
        // We might not have a listener if the listener was removed.
        if (listener && !listener.removed) {
          retval &=
              goog.events.fireListener(listener, eventObject) !== false;
        }
      }
    } finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray);
    }
  }

  return Boolean(retval);
};


/**
 * Fires a listener with a set of arguments
 *
 * @param {goog.events.Listener} listener The listener object to call.
 * @param {Object} eventObject The event object to pass to the listener.
 * @return {boolean} Result of listener.
 */
goog.events.fireListener = function(listener, eventObject) {
  if (listener.callOnce) {
    goog.events.unlistenByKey(listener.key);
  }
  return listener.handleEvent(eventObject);
};


/**
 * Gets the total number of listeners currently in the system.
 * @return {number} Number of listeners.
 */
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_);
};


/**
 * Dispatches an event (or event like object) and calls all listeners
 * listening for events of this type. The type of the event is decided by the
 * type property on the event object.
 *
 * If any of the listeners returns false OR calls preventDefault then this
 * function will return false.  If one of the capture listeners calls
 * stopPropagation, then the bubble listeners won't fire.
 *
 * @param {goog.events.EventTarget} src  The event target.
 * @param {string|Object|goog.events.Event} e Event object.
 * @return {boolean} If anyone called preventDefault on the event object (or
 *     if any of the handlers returns false) this will also return false.
 *     If there are no handlers, or if all handlers return true, this returns
 *     true.
 */
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if (!(type in map)) {
    return true;
  }

  // If accepting a string or object, create a custom event object so that
  // preventDefault and stopPropagation work with the event.
  if (goog.isString(e)) {
    e = new goog.events.Event(e, src);
  } else if (!(e instanceof goog.events.Event)) {
    var oldEvent = e;
    e = new goog.events.Event(type, src);
    goog.object.extend(e, oldEvent);
  } else {
    e.target = e.target || src;
  }

  var rv = 1, ancestors;

  map = map[type];
  var hasCapture = true in map;
  var targetsMap;

  if (hasCapture) {
    // Build ancestors now
    ancestors = [];
    for (var parent = src; parent; parent = parent.getParentEventTarget()) {
      ancestors.push(parent);
    }

    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;

    // Call capture listeners
    for (var i = ancestors.length - 1;
         !e.propagationStopped_ && i >= 0 && targetsMap.remaining_;
         i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type,
                                       true, e) &&
            e.returnValue_ != false;
    }
  }

  var hasBubble = false in map;
  if (hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;

    if (hasCapture) { // We have the ancestors.

      // Call bubble listeners
      for (var i = 0; !e.propagationStopped_ && i < ancestors.length &&
           targetsMap.remaining_;
           i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type,
                                         false, e) &&
              e.returnValue_ != false;
      }
    } else {
      // In case we don't have capture we don't have to build up the
      // ancestors array.

      for (var current = src;
           !e.propagationStopped_ && current && targetsMap.remaining_;
           current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type,
                                         false, e) &&
              e.returnValue_ != false;
      }
    }
  }

  return Boolean(rv);
};


/**
 * Installs exception protection for the browser event entry point using the
 * given error handler.
 *
 * @param {goog.debug.ErrorHandler} errorHandler Error handler with which to
 *     protect the entry point.
 */
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(
      goog.events.handleBrowserEvent_);
};


/**
 * Handles an event and dispatches it to the correct listeners. This
 * function is a proxy for the real listener the user specified.
 *
 * @param {number} key Unique key for the listener.
 * @param {Event=} opt_evt Optional event object that gets passed in via the
 *     native event handlers.
 * @return {boolean} Result of the event handler.
 * @this {goog.events.EventTarget|Object} The object or Element that
 *     fired the event.
 * @private
 */
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  // If the listener isn't there it was probably removed when processing
  // another listener on the same event (e.g. the later listener is
  // not managed by closure so that they are both fired under IE)
  if (!goog.events.listeners_[key]) {
    return true;
  }

  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;

  if (!(type in map)) {
    return true;
  }
  map = map[type];
  var retval, targetsMap;
  // Synthesize event propagation if the browser does not support W3C
  // event model.
  if (!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt ||
        /** @type {Event} */ (goog.getObjectByName('window.event'));

    // Check if we have any capturing event listeners for this type.
    var hasCapture = true in map;
    var hasBubble = false in map;

    if (hasCapture) {
      if (goog.events.isMarkedIeEvent_(ieEvent)) {
        return true;
      }

      goog.events.markIeEvent_(ieEvent);
    }

    var evt = new goog.events.BrowserEvent();
    evt.init(ieEvent, this);

    retval = true;
    try {
      if (hasCapture) {
        var ancestors = [];

        for (var parent = evt.currentTarget;
             parent;
             parent = parent.parentNode) {
          ancestors.push(parent);
        }

        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;

        // Call capture listeners
        for (var i = ancestors.length - 1;
             !evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;
             i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type,
                                               true, evt);
        }

        if (hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;

          // Call bubble listeners
          for (var i = 0;
               !evt.propagationStopped_ && i < ancestors.length &&
               targetsMap.remaining_;
               i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type,
                                                 false, evt);
          }
        }

      } else {
        // Bubbling, let IE handle the propagation.
        retval = goog.events.fireListener(listener, evt);
      }

    } finally {
      if (ancestors) {
        ancestors.length = 0;
      }
    }
    return retval;
  } // IE

  // Caught a non-IE DOM event. 1 additional argument which is the event object
  var be = new goog.events.BrowserEvent(opt_evt, this);
  retval = goog.events.fireListener(listener, be);
  return retval;
};


/**
 * This is used to mark the IE event object so we do not do the Closure pass
 * twice for a bubbling event.
 * @param {Event} e The IE browser event.
 * @private
 */
goog.events.markIeEvent_ = function(e) {
  // Only the keyCode and the returnValue can be changed. We use keyCode for
  // non keyboard events.
  // event.returnValue is a bit more tricky. It is undefined by default. A
  // boolean false prevents the default action. In a window.onbeforeunload and
  // the returnValue is non undefined it will be alerted. However, we will only
  // modify the returnValue for keyboard events. We can get a problem if non
  // closure events sets the keyCode or the returnValue

  var useReturnValue = false;

  if (e.keyCode == 0) {
    // We cannot change the keyCode in case that srcElement is input[type=file].
    // We could test that that is the case but that would allocate 3 objects.
    // If we use try/catch we will only allocate extra objects in the case of a
    // failure.
    /** @preserveTry */
    try {
      e.keyCode = -1;
      return;
    } catch (ex) {
      useReturnValue = true;
    }
  }

  if (useReturnValue ||
      /** @type {boolean|undefined} */ (e.returnValue) == undefined) {
    e.returnValue = true;
  }
};


/**
 * This is used to check if an IE event has already been handled by the Closure
 * system so we do not do the Closure pass twice for a bubbling event.
 * @param {Event} e  The IE browser event.
 * @return {boolean} True if the event object has been marked.
 * @private
 */
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined;
};


/**
 * Counter to create unique event ids.
 * @type {number}
 * @private
 */
goog.events.uniqueIdCounter_ = 0;


/**
 * Creates a unique event id.
 *
 * @param {string} identifier The identifier.
 * @return {string} A unique identifier.
 */
goog.events.getUniqueId = function(identifier) {
  return identifier + '_' + goog.events.uniqueIdCounter_++;
};


// Register the browser event handler as an entry point, so that
// it can be monitored for exception handling, etc.
goog.debug.entryPointRegistry.register(
    /**
     * @param {function(!Function): !Function} transformer The transforming
     *     function.
     */
    function(transformer) {
      goog.events.handleBrowserEvent_ = transformer(
          goog.events.handleBrowserEvent_);
    });
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Class to create objects which want to handle multiple events
 * and have their listeners easily cleaned up via a dispose method.
 *
 * Example:
 * <pre>
 * function Something() {
 *   goog.base(this);
 *
 *   ... set up object ...
 *
 *   // Add event listeners
 *   this.listen(this.starEl, goog.events.EventType.CLICK, this.handleStar);
 *   this.listen(this.headerEl, goog.events.EventType.CLICK, this.expand);
 *   this.listen(this.collapseEl, goog.events.EventType.CLICK, this.collapse);
 *   this.listen(this.infoEl, goog.events.EventType.MOUSEOVER, this.showHover);
 *   this.listen(this.infoEl, goog.events.EventType.MOUSEOUT, this.hideHover);
 * }
 * goog.inherits(Something, goog.events.EventHandler);
 *
 * Something.prototype.disposeInternal = function() {
 *   goog.base(this, 'disposeInternal');
 *   goog.dom.removeNode(this.container);
 * };
 *
 *
 * // Then elsewhere:
 *
 * var activeSomething = null;
 * function openSomething() {
 *   activeSomething = new Something();
 * }
 *
 * function closeSomething() {
 *   if (activeSomething) {
 *     activeSomething.dispose();  // Remove event listeners
 *     activeSomething = null;
 *   }
 * }
 * </pre>
 *
 */

goog.provide('goog.events.EventHandler');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventWrapper');



/**
 * Super class for objects that want to easily manage a number of event
 * listeners.  It allows a short cut to listen and also provides a quick way
 * to remove all events listeners belonging to this object.
 * @param {Object=} opt_handler Object in whose scope to call the listeners.
 * @constructor
 * @extends {goog.Disposable}
 */
goog.events.EventHandler = function(opt_handler) {
  goog.Disposable.call(this);
  this.handler_ = opt_handler;

  /**
   * Keys for events that are being listened to.
   * @type {Array.<number>}
   * @private
   */
  this.keys_ = [];
};
goog.inherits(goog.events.EventHandler, goog.Disposable);


/**
 * Utility array used to unify the cases of listening for an array of types
 * and listening for a single event, without using recursion or allocating
 * an array each time.
 * @type {Array.<string>}
 * @private
 */
goog.events.EventHandler.typeArray_ = [];


/**
 * Listen to an event on a DOM node or EventTarget.  If the function is omitted
 * then the EventHandler's handleEvent method will be used.
 * @param {goog.events.EventTarget|EventTarget} src Event source.
 * @param {string|Array.<string>} type Event type to listen for or array of
 *     event types.
 * @param {Function|Object=} opt_fn Optional callback function to be used as the
 *    listener or an object with handleEvent function.
 * @param {boolean=} opt_capture Optional whether to use capture phase.
 * @param {Object=} opt_handler Object in whose scope to call the listener.
 * @return {goog.events.EventHandler} This object, allowing for chaining of
 *     calls.
 */
goog.events.EventHandler.prototype.listen = function(src, type, opt_fn,
                                                     opt_capture,
                                                     opt_handler) {
  if (!goog.isArray(type)) {
    goog.events.EventHandler.typeArray_[0] = /** @type {string} */(type);
    type = goog.events.EventHandler.typeArray_;
  }
  for (var i = 0; i < type.length; i++) {
    // goog.events.listen generates unique keys so we don't have to check their
    // presence in the this.keys_ array.
    var key = (/** @type {number} */
        goog.events.listen(src, type[i], opt_fn || this,
                           opt_capture || false,
                           opt_handler || this.handler_ || this));
    this.keys_.push(key);
  }

  return this;
};


/**
 * Listen to an event on a DOM node or EventTarget.  If the function is omitted
 * then the EventHandler's handleEvent method will be used. After the event has
 * fired the event listener is removed from the target. If an array of event
 * types is provided, each event type will be listened to once.
 * @param {goog.events.EventTarget|EventTarget} src Event source.
 * @param {string|Array.<string>} type Event type to listen for or array of
 *     event types.
 * @param {Function|Object=} opt_fn Optional callback function to be used as the
 *    listener or an object with handleEvent function.
 * @param {boolean=} opt_capture Optional whether to use capture phase.
 * @param {Object=} opt_handler Object in whose scope to call the listener.
 * @return {goog.events.EventHandler} This object, allowing for chaining of
 *     calls.
 */
goog.events.EventHandler.prototype.listenOnce = function(src, type, opt_fn,
                                                         opt_capture,
                                                         opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      this.listenOnce(src, type[i], opt_fn, opt_capture, opt_handler);
    }
  } else {
    var key = (/** @type {number} */
        goog.events.listenOnce(src, type, opt_fn || this, opt_capture,
                               opt_handler || this.handler_ || this));
    this.keys_.push(key);
  }

  return this;
};


/**
 * Adds an event listener with a specific event wrapper on a DOM Node or an
 * object that has implemented {@link goog.events.EventTarget}. A listener can
 * only be added once to an object.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {goog.events.EventWrapper} wrapper Event wrapper to use.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {goog.events.EventHandler} This object, allowing for chaining of
 *     calls.
 */
goog.events.EventHandler.prototype.listenWithWrapper = function(src, wrapper,
    listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler || this.handler_ || this,
                 this);
  return this;
};


/**
 * @return {number} Number of listeners registered by this handler.
 */
goog.events.EventHandler.prototype.getListenerCount = function() {
  return this.keys_.length;
};


/**
 * Unlistens on an event.
 * @param {goog.events.EventTarget|EventTarget} src Event source.
 * @param {string|Array.<string>} type Event type to listen for.
 * @param {Function|Object=} opt_fn Optional callback function to be used as the
 *    listener or an object with handleEvent function.
 * @param {boolean=} opt_capture Optional whether to use capture phase.
 * @param {Object=} opt_handler Object in whose scope to call the listener.
 * @return {goog.events.EventHandler} This object, allowing for chaining of
 *     calls.
 */
goog.events.EventHandler.prototype.unlisten = function(src, type, opt_fn,
                                                       opt_capture,
                                                       opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      this.unlisten(src, type[i], opt_fn, opt_capture, opt_handler);
    }
  } else {
    var listener = goog.events.getListener(src, type, opt_fn || this,
        opt_capture, opt_handler || this.handler_ || this);

    if (listener) {
      var key = listener.key;
      goog.events.unlistenByKey(key);
      goog.array.remove(this.keys_, key);
    }
  }

  return this;
};


/**
 * Removes an event listener which was added with listenWithWrapper().
 *
 * @param {EventTarget|goog.events.EventTarget} src The target to stop
 *     listening to events on.
 * @param {goog.events.EventWrapper} wrapper Event wrapper to use.
 * @param {Function|Object} listener The listener function to remove.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase of the
 *     event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {goog.events.EventHandler} This object, allowing for chaining of
 *     calls.
 */
goog.events.EventHandler.prototype.unlistenWithWrapper = function(src, wrapper,
    listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt,
                   opt_handler || this.handler_ || this, this);
  return this;
};


/**
 * Unlistens to all events.
 */
goog.events.EventHandler.prototype.removeAll = function() {
  goog.array.forEach(this.keys_, goog.events.unlistenByKey);
  this.keys_.length = 0;
};


/**
 * Disposes of this EventHandler and removes all listeners that it registered.
 * @override
 * @protected
 */
goog.events.EventHandler.prototype.disposeInternal = function() {
  goog.events.EventHandler.superClass_.disposeInternal.call(this);
  this.removeAll();
};


/**
 * Default event handler
 * @param {goog.events.Event} e Event object.
 */
goog.events.EventHandler.prototype.handleEvent = function(e) {
  throw Error('EventHandler.handleEvent not implemented');
};
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Generator for unique element IDs.
 *
 */

goog.provide('goog.ui.IdGenerator');



/**
 * Creates a new id generator.
 * @constructor
 */
goog.ui.IdGenerator = function() {
};
goog.addSingletonGetter(goog.ui.IdGenerator);


/**
 * Next unique ID to use
 * @type {number}
 * @private
 */
goog.ui.IdGenerator.prototype.nextId_ = 0;


/**
 * Gets the next unique ID.
 * @return {string} The next unique identifier.
 */
goog.ui.IdGenerator.prototype.getNextUniqueId = function() {
  return ':' + (this.nextId_++).toString(36);
};


/**
 * Default instance for id generation. Done as an instance instead of statics
 * so it's possible to inject a mock for unit testing purposes.
 * @type {goog.ui.IdGenerator}
 * @deprecated Use goog.ui.IdGenerator.getInstance() instead and do not refer
 * to goog.ui.IdGenerator.instance anymore.
 */
goog.ui.IdGenerator.instance = goog.ui.IdGenerator.getInstance();
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Implementation of EventTarget as defined by W3C DOM 2/3.
 *
 * @author arv@google.com (Erik Arvidsson) [Original implementation]
 * @author pupius@google.com (Daniel Pupius) [Port to use goog.events]
 * @see ../demos/eventtarget.html
 */


/**
 * Namespace for events
 */
goog.provide('goog.events.EventTarget');

goog.require('goog.Disposable');
goog.require('goog.events');



/**
 * Inherit from this class to give your object the ability to dispatch events.
 * Note that this class provides event <em>sending</em> behaviour, not event
 * receiving behaviour: your object will be able to broadcast events, and other
 * objects will be able to listen for those events using goog.events.listen().
 *
 * <p>The name "EventTarget" reflects the fact that this class implements the
 * <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html">
 * EventTarget interface</a> as defined by W3C DOM 2/3, with a few differences:
 * <ul>
 * <li>Event objects do not have to implement the Event interface. An object
 *     is treated as an event object if it has a 'type' property.
 * <li>You can use a plain string instead of an event object; an event-like
 *     object will be created with the 'type' set to the string value.
 * </ul>
 *
 * <p>Unless propagation is stopped, an event dispatched by an EventTarget
 * will bubble to the parent returned by <code>getParentEventTarget</code>.
 * To set the parent, call <code>setParentEventTarget</code> or override
 * <code>getParentEventTarget</code> in a subclass.  Subclasses that don't
 * support changing the parent should override the setter to throw an error.
 *
 * <p>Example usage:
 * <pre>
 *   var source = new goog.events.EventTarget();
 *   function handleEvent(event) {
 *     alert('Type: ' + e.type + '\nTarget: ' + e.target);
 *   }
 *   goog.events.listen(source, 'foo', handleEvent);
 *   ...
 *   source.dispatchEvent({type: 'foo'}); // will call handleEvent
 *   // or source.dispatchEvent('foo');
 *   ...
 *   goog.events.unlisten(source, 'foo', handleEvent);
 *
 *   // You can also use the Listener interface:
 *   var listener = {
 *     handleEvent: function(event) {
 *       ...
 *     }
 *   };
 *   goog.events.listen(source, 'bar', listener);
 * </pre>
 *
 * @constructor
 * @extends {goog.Disposable}
 */
goog.events.EventTarget = function() {
  goog.Disposable.call(this);
};
goog.inherits(goog.events.EventTarget, goog.Disposable);


/**
 * Used to tell if an event is a real event in goog.events.listen() so we don't
 * get listen() calling addEventListener() and vice-versa.
 * @type {boolean}
 * @private
 */
goog.events.EventTarget.prototype.customEvent_ = true;


/**
 * Parent event target, used during event bubbling.
 * @type {goog.events.EventTarget?}
 * @private
 */
goog.events.EventTarget.prototype.parentEventTarget_ = null;


/**
 * Returns the parent of this event target to use for bubbling.
 *
 * @return {goog.events.EventTarget} The parent EventTarget or null if there
 * is no parent.
 */
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_;
};


/**
 * Sets the parent of this event target to use for bubbling.
 *
 * @param {goog.events.EventTarget?} parent Parent EventTarget (null if none).
 */
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent;
};


/**
 * Adds an event listener to the event target. The same handler can only be
 * added once per the type. Even if you add the same handler multiple times
 * using the same type then it will only be called once when the event is
 * dispatched.
 *
 * Supported for legacy but use goog.events.listen(src, type, handler) instead.
 *
 * @param {string} type The type of the event to listen for.
 * @param {Function|Object} handler The function to handle the event. The
 *     handler can also be an object that implements the handleEvent method
 *     which takes the event object as argument.
 * @param {boolean=} opt_capture In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase
 *     of the event.
 * @param {Object=} opt_handlerScope Object in whose scope to call the listener.
 */
goog.events.EventTarget.prototype.addEventListener = function(
    type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope);
};


/**
 * Removes an event listener from the event target. The handler must be the
 * same object as the one added. If the handler has not been added then
 * nothing is done.
 * @param {string} type The type of the event to listen for.
 * @param {Function|Object} handler The function to handle the event. The
 *     handler can also be an object that implements the handleEvent method
 *     which takes the event object as argument.
 * @param {boolean=} opt_capture In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase
 *     of the event.
 * @param {Object=} opt_handlerScope Object in whose scope to call the listener.
 */
goog.events.EventTarget.prototype.removeEventListener = function(
    type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope);
};


/**
 * Dispatches an event (or event like object) and calls all listeners
 * listening for events of this type. The type of the event is decided by the
 * type property on the event object.
 *
 * If any of the listeners returns false OR calls preventDefault then this
 * function will return false.  If one of the capture listeners calls
 * stopPropagation, then the bubble listeners won't fire.
 *
 * @param {string|Object|goog.events.Event} e Event object.
 * @return {boolean} If anyone called preventDefault on the event object (or
 *     if any of the handlers returns false this will also return false.
 */
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e);
};


/**
 * Unattach listeners from this object.  Classes that extend EventTarget may
 * need to override this method in order to remove references to DOM Elements
 * and additional listeners, it should be something like this:
 * <pre>
 * MyClass.prototype.disposeInternal = function() {
 *   MyClass.superClass_.disposeInternal.call(this);
 *   // Dispose logic for MyClass
 * };
 * </pre>
 * @override
 * @protected
 */
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null;
};
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Abstract class for all UI components. This defines the standard
 * design pattern that all UI components should follow.
 *
 * @see ../demos/samplecomponent.html
 * @see http://code.google.com/p/closure-library/wiki/IntroToComponents
 */

goog.provide('goog.ui.Component');
goog.provide('goog.ui.Component.Error');
goog.provide('goog.ui.Component.EventType');
goog.provide('goog.ui.Component.State');

goog.require('goog.array');
goog.require('goog.array.ArrayLike');
goog.require('goog.dom');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.object');
goog.require('goog.style');
goog.require('goog.ui.IdGenerator');



/**
 * Default implementation of UI component.
 *
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
goog.ui.Component = function(opt_domHelper) {
  goog.events.EventTarget.call(this);
  this.dom_ = opt_domHelper || goog.dom.getDomHelper();

  // Set the defalt right to left value.
  this.rightToLeft_ = goog.ui.Component.defaultRightToLeft_;
};
goog.inherits(goog.ui.Component, goog.events.EventTarget);


/**
 * Generator for unique IDs.
 * @type {goog.ui.IdGenerator}
 * @private
 */
goog.ui.Component.prototype.idGenerator_ = goog.ui.IdGenerator.getInstance();


/**
 * The default right to left value.
 * @type {?boolean}
 * @private
 */
goog.ui.Component.defaultRightToLeft_ = null;


/**
 * Common events fired by components so that event propagation is useful.  Not
 * all components are expected to dispatch or listen for all event types.
 * Events dispatched before a state transition should be cancelable to prevent
 * the corresponding state change.
 * @enum {string}
 */
goog.ui.Component.EventType = {
  /** Dispatched before the component becomes visible. */
  BEFORE_SHOW: 'beforeshow',

  /**
   * Dispatched after the component becomes visible.
   * NOTE(user): For goog.ui.Container, this actually fires before containers
   * are shown.  Use goog.ui.Container.EventType.AFTER_SHOW if you want an event
   * that fires after a goog.ui.Container is shown.
   */
  SHOW: 'show',

  /** Dispatched before the component becomes hidden. */
  HIDE: 'hide',

  /** Dispatched before the component becomes disabled. */
  DISABLE: 'disable',

  /** Dispatched before the component becomes enabled. */
  ENABLE: 'enable',

  /** Dispatched before the component becomes highlighted. */
  HIGHLIGHT: 'highlight',

  /** Dispatched before the component becomes un-highlighted. */
  UNHIGHLIGHT: 'unhighlight',

  /** Dispatched before the component becomes activated. */
  ACTIVATE: 'activate',

  /** Dispatched before the component becomes deactivated. */
  DEACTIVATE: 'deactivate',

  /** Dispatched before the component becomes selected. */
  SELECT: 'select',

  /** Dispatched before the component becomes un-selected. */
  UNSELECT: 'unselect',

  /** Dispatched before a component becomes checked. */
  CHECK: 'check',

  /** Dispatched before a component becomes un-checked. */
  UNCHECK: 'uncheck',

  /** Dispatched before a component becomes focused. */
  FOCUS: 'focus',

  /** Dispatched before a component becomes blurred. */
  BLUR: 'blur',

  /** Dispatched before a component is opened (expanded). */
  OPEN: 'open',

  /** Dispatched before a component is closed (collapsed). */
  CLOSE: 'close',

  /** Dispatched after a component is moused over. */
  ENTER: 'enter',

  /** Dispatched after a component is moused out of. */
  LEAVE: 'leave',

  /** Dispatched after the user activates the component. */
  ACTION: 'action',

  /** Dispatched after the external-facing state of a component is changed. */
  CHANGE: 'change'
};


/**
 * Errors thrown by the component.
 * @enum {string}
 */
goog.ui.Component.Error = {
  /**
   * Error when a method is not supported.
   */
  NOT_SUPPORTED: 'Method not supported',

  /**
   * Error when the given element can not be decorated.
   */
  DECORATE_INVALID: 'Invalid element to decorate',

  /**
   * Error when the component is already rendered and another render attempt is
   * made.
   */
  ALREADY_RENDERED: 'Component already rendered',

  /**
   * Error when an attempt is made to set the parent of a component in a way
   * that would result in an inconsistent object graph.
   */
  PARENT_UNABLE_TO_BE_SET: 'Unable to set parent component',

  /**
   * Error when an attempt is made to add a child component at an out-of-bounds
   * index.  We don't support sparse child arrays.
   */
  CHILD_INDEX_OUT_OF_BOUNDS: 'Child component index out of bounds',

  /**
   * Error when an attempt is made to remove a child component from a component
   * other than its parent.
   */
  NOT_OUR_CHILD: 'Child is not in parent component',

  /**
   * Error when an operation requiring DOM interaction is made when the
   * component is not in the document
   */
  NOT_IN_DOCUMENT: 'Operation not supported while component is not in document',

  /**
   * Error when an invalid component state is encountered.
   */
  STATE_INVALID: 'Invalid component state'
};


/**
 * Common component states.  Components may have distinct appearance depending
 * on what state(s) apply to them.  Not all components are expected to support
 * all states.
 * @enum {number}
 */
goog.ui.Component.State = {
  /**
   * Union of all supported component states.
   */
  ALL: 0xFF,

  /**
   * Component is disabled.
   * @see goog.ui.Component.EventType.DISABLE
   * @see goog.ui.Component.EventType.ENABLE
   */
  DISABLED: 0x01,

  /**
   * Component is highlighted.
   * @see goog.ui.Component.EventType.HIGHLIGHT
   * @see goog.ui.Component.EventType.UNHIGHLIGHT
   */
  HOVER: 0x02,

  /**
   * Component is active (or "pressed").
   * @see goog.ui.Component.EventType.ACTIVATE
   * @see goog.ui.Component.EventType.DEACTIVATE
   */
  ACTIVE: 0x04,

  /**
   * Component is selected.
   * @see goog.ui.Component.EventType.SELECT
   * @see goog.ui.Component.EventType.UNSELECT
   */
  SELECTED: 0x08,

  /**
   * Component is checked.
   * @see goog.ui.Component.EventType.CHECK
   * @see goog.ui.Component.EventType.UNCHECK
   */
  CHECKED: 0x10,

  /**
   * Component has focus.
   * @see goog.ui.Component.EventType.FOCUS
   * @see goog.ui.Component.EventType.BLUR
   */
  FOCUSED: 0x20,

  /**
   * Component is opened (expanded).  Applies to tree nodes, menu buttons,
   * submenus, zippys (zippies?), etc.
   * @see goog.ui.Component.EventType.OPEN
   * @see goog.ui.Component.EventType.CLOSE
   */
  OPENED: 0x40
};


/**
 * Static helper method; returns the type of event components are expected to
 * dispatch when transitioning to or from the given state.
 * @param {goog.ui.Component.State} state State to/from which the component
 *     is transitioning.
 * @param {boolean} isEntering Whether the component is entering or leaving the
 *     state.
 * @return {goog.ui.Component.EventType} Event type to dispatch.
 */
goog.ui.Component.getStateTransitionEvent = function(state, isEntering) {
  switch (state) {
    case goog.ui.Component.State.DISABLED:
      return isEntering ? goog.ui.Component.EventType.DISABLE :
          goog.ui.Component.EventType.ENABLE;
    case goog.ui.Component.State.HOVER:
      return isEntering ? goog.ui.Component.EventType.HIGHLIGHT :
          goog.ui.Component.EventType.UNHIGHLIGHT;
    case goog.ui.Component.State.ACTIVE:
      return isEntering ? goog.ui.Component.EventType.ACTIVATE :
          goog.ui.Component.EventType.DEACTIVATE;
    case goog.ui.Component.State.SELECTED:
      return isEntering ? goog.ui.Component.EventType.SELECT :
          goog.ui.Component.EventType.UNSELECT;
    case goog.ui.Component.State.CHECKED:
      return isEntering ? goog.ui.Component.EventType.CHECK :
          goog.ui.Component.EventType.UNCHECK;
    case goog.ui.Component.State.FOCUSED:
      return isEntering ? goog.ui.Component.EventType.FOCUS :
          goog.ui.Component.EventType.BLUR;
    case goog.ui.Component.State.OPENED:
      return isEntering ? goog.ui.Component.EventType.OPEN :
          goog.ui.Component.EventType.CLOSE;
    default:
      // Fall through.
  }

  // Invalid state.
  throw Error(goog.ui.Component.Error.STATE_INVALID);
};


/**
 * Set the default right-to-left value. This causes all component's created from
 * this point foward to have the given value. This is useful for cases where
 * a given page is always in one directionality, avoiding unnecessary
 * right to left determinations.
 * @param {?boolean} rightToLeft Whether the components should be rendered
 *     right-to-left. Null iff components should determine their directionality.
 */
goog.ui.Component.setDefaultRightToLeft = function(rightToLeft) {
  goog.ui.Component.defaultRightToLeft_ = rightToLeft;
};


/**
 * Unique ID of the component, lazily initialized in {@link
 * goog.ui.Component#getId} if needed.  This property is strictly private and
 * must not be accessed directly outside of this class!
 * @type {?string}
 * @private
 */
goog.ui.Component.prototype.id_ = null;


/**
 * DomHelper used to interact with the document, allowing components to be
 * created in a different window.
 * @type {!goog.dom.DomHelper}
 * @protected
 * @suppress {underscore}
 */
goog.ui.Component.prototype.dom_;


/**
 * Whether the component is in the document.
 * @type {boolean}
 * @private
 */
goog.ui.Component.prototype.inDocument_ = false;


// TODO(attila): Stop referring to this private field in subclasses.
/**
 * The DOM element for the component.
 * @type {Element}
 * @private
 */
goog.ui.Component.prototype.element_ = null;


/**
 * Event handler.
 * TODO(user): rename it to handler_ after all component subclasses in
 * inside Google have been cleaned up.
 * Code search: http://go/component_code_search
 * @type {goog.events.EventHandler}
 * @private
 */
goog.ui.Component.prototype.googUiComponentHandler_;


/**
 * Whether the component is rendered right-to-left.  Right-to-left is set
 * lazily when {@link #isRightToLeft} is called the first time, unless it has
 * been set by calling {@link #setRightToLeft} explicitly.
 * @type {?boolean}
 * @private
 */
goog.ui.Component.prototype.rightToLeft_ = null;


/**
 * Arbitrary data object associated with the component.  Such as meta-data.
 * @type {*}
 * @private
 */
goog.ui.Component.prototype.model_ = null;


/**
 * Parent component to which events will be propagated.  This property is
 * strictly private and must not be accessed directly outside of this class!
 * @type {goog.ui.Component?}
 * @private
 */
goog.ui.Component.prototype.parent_ = null;


/**
 * Array of child components.  Lazily initialized on first use.  Must be kept in
 * sync with {@code childIndex_}.  This property is strictly private and must
 * not be accessed directly outside of this class!
 * @type {Array.<goog.ui.Component>?}
 * @private
 */
goog.ui.Component.prototype.children_ = null;


/**
 * Map of child component IDs to child components.  Used for constant-time
 * random access to child components by ID.  Lazily initialized on first use.
 * Must be kept in sync with {@code children_}.  This property is strictly
 * private and must not be accessed directly outside of this class!
 *
 * We use a plain Object, not a {@link goog.structs.Map}, for simplicity.
 * This means components can't have children with IDs such as 'constructor' or
 * 'valueOf', but this shouldn't really be an issue in practice, and if it is,
 * we can always fix it later without changing the API.
 *
 * @type {Object}
 * @private
 */
goog.ui.Component.prototype.childIndex_ = null;


/**
 * Flag used to keep track of whether a component decorated an already existing
 * element or whether it created the DOM itself.
 *
 * If an element is decorated, dispose will leave the node in the document.
 * It is up to the app to remove the node.
 *
 * If an element was rendered, dispose will remove the node automatically.
 *
 * @type {boolean}
 * @private
 */
goog.ui.Component.prototype.wasDecorated_ = false;


/**
 * Gets the unique ID for the instance of this component.  If the instance
 * doesn't already have an ID, generates one on the fly.
 * @return {string} Unique component ID.
 */
goog.ui.Component.prototype.getId = function() {
  return this.id_ || (this.id_ = this.idGenerator_.getNextUniqueId());
};


/**
 * Assigns an ID to this component instance.  It is the caller's responsibility
 * to guarantee that the ID is unique.  If the component is a child of a parent
 * component, then the parent component's child index is updated to reflect the
 * new ID; this may throw an error if the parent already has a child with an ID
 * that conflicts with the new ID.
 * @param {string} id Unique component ID.
 */
goog.ui.Component.prototype.setId = function(id) {
  if (this.parent_ && this.parent_.childIndex_) {
    // Update the parent's child index.
    goog.object.remove(this.parent_.childIndex_, this.id_);
    goog.object.add(this.parent_.childIndex_, id, this);
  }

  // Update the component ID.
  this.id_ = id;
};


/**
 * Gets the component's element.
 * @return {Element} The element for the component.
 */
goog.ui.Component.prototype.getElement = function() {
  return this.element_;
};


/**
 * Sets the component's root element to the given element.  Considered
 * protected and final.
 *
 * This should generally only be called during createDom. Setting the element
 * does not actually change which element is rendered, only the element that is
 * associated with this UI component.
 *
 * @param {Element} element Root element for the component.
 * @protected
 */
goog.ui.Component.prototype.setElementInternal = function(element) {
  this.element_ = element;
};


/**
 * Returns an array of all the elements in this component's DOM with the
 * provided className.
 * @param {string} className The name of the class to look for.
 * @return {!goog.array.ArrayLike} The items found with the class name provided.
 */
goog.ui.Component.prototype.getElementsByClass = function(className) {
  return this.element_ ?
      this.dom_.getElementsByClass(className, this.element_) : [];
};


/**
 * Returns the first element in this component's DOM with the provided
 * className.
 * @param {string} className The name of the class to look for.
 * @return {Element} The first item with the class name provided.
 */
goog.ui.Component.prototype.getElementByClass = function(className) {
  return this.element_ ?
      this.dom_.getElementByClass(className, this.element_) : null;
};


/**
 * Returns the event handler for this component, lazily created the first time
 * this method is called.
 * @return {!goog.events.EventHandler} Event handler for this component.
 * @protected
 */
goog.ui.Component.prototype.getHandler = function() {
  return this.googUiComponentHandler_ ||
         (this.googUiComponentHandler_ = new goog.events.EventHandler(this));
};


/**
 * Sets the parent of this component to use for event bubbling.  Throws an error
 * if the component already has a parent or if an attempt is made to add a
 * component to itself as a child.  Callers must use {@code removeChild}
 * or {@code removeChildAt} to remove components from their containers before
 * calling this method.
 * @see goog.ui.Component#removeChild
 * @see goog.ui.Component#removeChildAt
 * @param {goog.ui.Component} parent The parent component.
 */
goog.ui.Component.prototype.setParent = function(parent) {
  if (this == parent) {
    // Attempting to add a child to itself is an error.
    throw Error(goog.ui.Component.Error.PARENT_UNABLE_TO_BE_SET);
  }

  if (parent && this.parent_ && this.id_ && this.parent_.getChild(this.id_) &&
      this.parent_ != parent) {
    // This component is already the child of some parent, so it should be
    // removed using removeChild/removeChildAt first.
    throw Error(goog.ui.Component.Error.PARENT_UNABLE_TO_BE_SET);
  }

  this.parent_ = parent;
  goog.ui.Component.superClass_.setParentEventTarget.call(this, parent);
};


/**
 * Returns the component's parent, if any.
 * @return {goog.ui.Component?} The parent component.
 */
goog.ui.Component.prototype.getParent = function() {
  return this.parent_;
};


/**
 * Overrides {@link goog.events.EventTarget#setParentEventTarget} to throw an
 * error if the parent component is set, and the argument is not the parent.
 * @override
 */
goog.ui.Component.prototype.setParentEventTarget = function(parent) {
  if (this.parent_ && this.parent_ != parent) {
    throw Error(goog.ui.Component.Error.NOT_SUPPORTED);
  }
  goog.ui.Component.superClass_.setParentEventTarget.call(this, parent);
};


/**
 * Returns the dom helper that is being used on this component.
 * @return {!goog.dom.DomHelper} The dom helper used on this component.
 */
goog.ui.Component.prototype.getDomHelper = function() {
  return this.dom_;
};


/**
 * Determines whether the component has been added to the document.
 * @return {boolean} TRUE if rendered. Otherwise, FALSE.
 */
goog.ui.Component.prototype.isInDocument = function() {
  return this.inDocument_;
};


/**
 * Creates the initial DOM representation for the component.  The default
 * implementation is to set this.element_ = div.
 */
goog.ui.Component.prototype.createDom = function() {
  this.element_ = this.dom_.createElement('div');
};


/**
 * Renders the component.  If a parent element is supplied, the component's
 * element will be appended to it.  If there is no optional parent element and
 * the element doesn't have a parentNode then it will be appended to the
 * document body.
 *
 * If this component has a parent component, and the parent component is
 * not in the document already, then this will not call {@code enterDocument}
 * on this component.
 *
 * Throws an Error if the component is already rendered.
 *
 * @param {Element=} opt_parentElement Optional parent element to render the
 *    component into.
 */
goog.ui.Component.prototype.render = function(opt_parentElement) {
  this.render_(opt_parentElement);
};


/**
 * Renders the component before another element. The other element should be in
 * the document already.
 *
 * Throws an Error if the component is already rendered.
 *
 * @param {Node} sibling Node to render the component before.
 */
goog.ui.Component.prototype.renderBefore = function(sibling) {
  this.render_(/** @type {Element} */ (sibling.parentNode),
               sibling);
};


/**
 * Renders the component.  If a parent element is supplied, the component's
 * element will be appended to it.  If there is no optional parent element and
 * the element doesn't have a parentNode then it will be appended to the
 * document body.
 *
 * If this component has a parent component, and the parent component is
 * not in the document already, then this will not call {@code enterDocument}
 * on this component.
 *
 * Throws an Error if the component is already rendered.
 *
 * @param {Element=} opt_parentElement Optional parent element to render the
 *    component into.
 * @param {Node=} opt_beforeNode Node before which the component is to
 *    be rendered.  If left out the node is appended to the parent element.
 * @private
 */
goog.ui.Component.prototype.render_ = function(opt_parentElement,
                                               opt_beforeNode) {
  if (this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }

  if (!this.element_) {
    this.createDom();
  }

  if (opt_parentElement) {
    opt_parentElement.insertBefore(this.element_, opt_beforeNode || null);
  } else {
    this.dom_.getDocument().body.appendChild(this.element_);
  }

  // If this component has a parent component that isn't in the document yet,
  // we don't call enterDocument() here.  Instead, when the parent component
  // enters the document, the enterDocument() call will propagate to its
  // children, including this one.  If the component doesn't have a parent
  // or if the parent is already in the document, we call enterDocument().
  if (!this.parent_ || this.parent_.isInDocument()) {
    this.enterDocument();
  }
};


/**
 * Decorates the element for the UI component.
 * @param {Element} element Element to decorate.
 */
goog.ui.Component.prototype.decorate = function(element) {
  if (this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  } else if (element && this.canDecorate(element)) {
    this.wasDecorated_ = true;

    // Set the DOM helper of the component to match the decorated element.
    if (!this.dom_ ||
        this.dom_.getDocument() != goog.dom.getOwnerDocument(element)) {
      this.dom_ = goog.dom.getDomHelper(element);
    }

    // Call specific component decorate logic.
    this.decorateInternal(element);
    this.enterDocument();
  } else {
    throw Error(goog.ui.Component.Error.DECORATE_INVALID);
  }
};


/**
 * Determines if a given element can be decorated by this type of component.
 * This method should be overridden by inheriting objects.
 * @param {Element} element Element to decorate.
 * @return {boolean} True if the element can be decorated, false otherwise.
 */
goog.ui.Component.prototype.canDecorate = function(element) {
  return true;
};


/**
 * @return {boolean} Whether the component was decorated.
 */
goog.ui.Component.prototype.wasDecorated = function() {
  return this.wasDecorated_;
};


/**
 * Actually decorates the element. Should be overridden by inheriting objects.
 * This method can assume there are checks to ensure the component has not
 * already been rendered have occurred and that enter document will be called
 * afterwards. This method is considered protected.
 * @param {Element} element Element to decorate.
 * @protected
 */
goog.ui.Component.prototype.decorateInternal = function(element) {
  this.element_ = element;
};


/**
 * Called when the component's element is known to be in the document. Anything
 * using document.getElementById etc. should be done at this stage.
 *
 * If the component contains child components, this call is propagated to its
 * children.
 */
goog.ui.Component.prototype.enterDocument = function() {
  this.inDocument_ = true;

  // Propagate enterDocument to child components that have a DOM, if any.
  this.forEachChild(function(child) {
    if (!child.isInDocument() && child.getElement()) {
      child.enterDocument();
    }
  });
};


/**
 * Called by dispose to clean up the elements and listeners created by a
 * component, or by a parent component/application who has removed the
 * component from the document but wants to reuse it later.
 *
 * If the component contains child components, this call is propagated to its
 * children.
 *
 * It should be possible for the component to be rendered again once this method
 * has been called.
 */
goog.ui.Component.prototype.exitDocument = function() {
  // Propagate exitDocument to child components that have been rendered, if any.
  this.forEachChild(function(child) {
    if (child.isInDocument()) {
      child.exitDocument();
    }
  });

  if (this.googUiComponentHandler_) {
    this.googUiComponentHandler_.removeAll();
  }

  this.inDocument_ = false;
};


/**
 * Disposes of the component.  Calls {@code exitDocument}, which is expected to
 * remove event handlers and clean up the component.  Propagates the call to
 * the component's children, if any. Removes the component's DOM from the
 * document unless it was decorated.
 * @override
 * @protected
 */
goog.ui.Component.prototype.disposeInternal = function() {
  goog.ui.Component.superClass_.disposeInternal.call(this);

  if (this.inDocument_) {
    this.exitDocument();
  }

  if (this.googUiComponentHandler_) {
    this.googUiComponentHandler_.dispose();
    delete this.googUiComponentHandler_;
  }

  // Disposes of the component's children, if any.
  this.forEachChild(function(child) {
    child.dispose();
  });

  // Detach the component's element from the DOM, unless it was decorated.
  if (!this.wasDecorated_ && this.element_) {
    goog.dom.removeNode(this.element_);
  }

  this.children_ = null;
  this.childIndex_ = null;
  this.element_ = null;
  this.model_ = null;
  this.parent_ = null;
  // TODO(gboyer): delete this.dom_ breaks many unit tests.
};


/**
 * Helper function for subclasses that gets a unique id for a given fragment,
 * this can be used by components to generate unique string ids for DOM
 * elements.
 * @param {string} idFragment A partial id.
 * @return {string} Unique element id.
 */
goog.ui.Component.prototype.makeId = function(idFragment) {
  return this.getId() + '.' + idFragment;
};


/**
 * Makes a collection of ids.  This is a convenience method for makeId.  The
 * object's values are the id fragments and the new values are the generated
 * ids.  The key will remain the same.
 * @param {Object} object The object that will be used to create the ids.
 * @return {Object} An object of id keys to generated ids.
 */
goog.ui.Component.prototype.makeIds = function(object) {
  var ids = {};
  for (var key in object) {
    ids[key] = this.makeId(object[key]);
  }
  return ids;
};


/**
 * Returns the model associated with the UI component.
 * @return {*} The model.
 */
goog.ui.Component.prototype.getModel = function() {
  return this.model_;
};


/**
 * Sets the model associated with the UI component.
 * @param {*} obj The model.
 */
goog.ui.Component.prototype.setModel = function(obj) {
  this.model_ = obj;
};


/**
 * Helper function for returning the fragment portion of an id generated using
 * makeId().
 * @param {string} id Id generated with makeId().
 * @return {string} Fragment.
 */
goog.ui.Component.prototype.getFragmentFromId = function(id) {
  return id.substring(this.getId().length + 1);
};


/**
 * Helper function for returning an element in the document with a unique id
 * generated using makeId().
 * @param {string} idFragment The partial id.
 * @return {Element} The element with the unique id, or null if it cannot be
 *     found.
 */
goog.ui.Component.prototype.getElementByFragment = function(idFragment) {
  if (!this.inDocument_) {
    throw Error(goog.ui.Component.Error.NOT_IN_DOCUMENT);
  }
  return this.dom_.getElement(this.makeId(idFragment));
};


/**
 * Adds the specified component as the last child of this component.  See
 * {@link goog.ui.Component#addChildAt} for detailed semantics.
 *
 * @see goog.ui.Component#addChildAt
 * @param {goog.ui.Component} child The new child component.
 * @param {boolean=} opt_render If true, the child component will be rendered
 *    into the parent.
 */
goog.ui.Component.prototype.addChild = function(child, opt_render) {
  // TODO(gboyer): addChildAt(child, this.getChildCount(), false) will
  // reposition any already-rendered child to the end.  Instead, perhaps
  // addChild(child, false) should never reposition the child; instead, clients
  // that need the repositioning will use addChildAt explicitly.  Right now,
  // clients can get around this by calling addChild first.
  this.addChildAt(child, this.getChildCount(), opt_render);
};


/**
 * Adds the specified component as a child of this component at the given
 * 0-based index.
 *
 * Both {@code addChild} and {@code addChildAt} assume the following contract
 * between parent and child components:
 *  <ul>
 *    <li>the child component's element must be a descendant of the parent
 *        component's element, and
 *    <li>the DOM state of the child component must be consistent with the DOM
 *        state of the parent component (see {@code isInDocument}) in the
 *        steady state -- the exception is to addChildAt(child, i, false) and
 *        then immediately decorate/render the child.
 *  </ul>
 *
 * In particular, {@code parent.addChild(child)} will throw an error if the
 * child component is already in the document, but the parent isn't.
 *
 * Clients of this API may call {@code addChild} and {@code addChildAt} with
 * {@code opt_render} set to true.  If {@code opt_render} is true, calling these
 * methods will automatically render the child component's element into the
 * parent component's element.  However, {@code parent.addChild(child, true)}
 * will throw an error if:
 *  <ul>
 *    <li>the parent component has no DOM (i.e. {@code parent.getElement()} is
 *        null), or
 *    <li>the child component is already in the document, regardless of the
 *        parent's DOM state.
 *  </ul>
 *
 * If {@code opt_render} is true and the parent component is not already
 * in the document, {@code enterDocument} will not be called on this component
 * at this point.
 *
 * Finally, this method also throws an error if the new child already has a
 * different parent, or the given index is out of bounds.
 *
 * @see goog.ui.Component#addChild
 * @param {goog.ui.Component} child The new child component.
 * @param {number} index 0-based index at which the new child component is to be
 *    added; must be between 0 and the current child count (inclusive).
 * @param {boolean=} opt_render If true, the child component will be rendered
 *    into the parent.
 * @return {void} Nada.
 */
goog.ui.Component.prototype.addChildAt = function(child, index, opt_render) {
  if (child.inDocument_ && (opt_render || !this.inDocument_)) {
    // Adding a child that's already in the document is an error, except if the
    // parent is also in the document and opt_render is false (e.g. decorate()).
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }

  if (index < 0 || index > this.getChildCount()) {
    // Allowing sparse child arrays would lead to strange behavior, so we don't.
    throw Error(goog.ui.Component.Error.CHILD_INDEX_OUT_OF_BOUNDS);
  }

  // Create the index and the child array on first use.
  if (!this.childIndex_ || !this.children_) {
    this.childIndex_ = {};
    this.children_ = [];
  }

  // Moving child within component, remove old reference.
  if (child.getParent() == this) {
    goog.object.set(this.childIndex_, child.getId(), child);
    goog.array.remove(this.children_, child);

  // Add the child to this component.  goog.object.add() throws an error if
  // a child with the same ID already exists.
  } else {
    goog.object.add(this.childIndex_, child.getId(), child);
  }

  // Set the parent of the child to this component.  This throws an error if
  // the child is already contained by another component.
  child.setParent(this);
  goog.array.insertAt(this.children_, child, index);

  if (child.inDocument_ && this.inDocument_ && child.getParent() == this) {
    // Changing the position of an existing child, move the DOM node.
    var contentElement = this.getContentElement();
    contentElement.insertBefore(child.getElement(),
        (contentElement.childNodes[index] || null));

  } else if (opt_render) {
    // If this (parent) component doesn't have a DOM yet, call createDom now
    // to make sure we render the child component's element into the correct
    // parent element (otherwise render_ with a null first argument would
    // render the child into the document body, which is almost certainly not
    // what we want).
    if (!this.element_) {
      this.createDom();
    }
    // Render the child into the parent at the appropriate location.  Note that
    // getChildAt(index + 1) returns undefined if inserting at the end.
    // TODO(attila): We should have a renderer with a renderChildAt API.
    var sibling = this.getChildAt(index + 1);
    // render_() calls enterDocument() if the parent is already in the document.
    child.render_(this.getContentElement(), sibling ? sibling.element_ : null);
  } else if (this.inDocument_ && !child.inDocument_ && child.element_ &&
      child.element_.parentNode &&
      // Under some circumstances, IE8 implicitly creates a Document Fragment
      // for detached nodes, so ensure the parent is an Element as it should be.
      child.element_.parentNode.nodeType == goog.dom.NodeType.ELEMENT) {
    // We don't touch the DOM, but if the parent is in the document, and the
    // child element is in the document but not marked as such, then we call
    // enterDocument on the child.
    // TODO(gboyer): It would be nice to move this condition entirely, but
    // there's a large risk of breaking existing applications that manually
    // append the child to the DOM and then call addChild.
    child.enterDocument();
  }
};


/**
 * Returns the DOM element into which child components are to be rendered,
 * or null if the component itself hasn't been rendered yet.  This default
 * implementation returns the component's root element.  Subclasses with
 * complex DOM structures must override this method.
 * @return {Element} Element to contain child elements (null if none).
 */
goog.ui.Component.prototype.getContentElement = function() {
  return this.element_;
};


/**
 * Returns true if the component is rendered right-to-left, false otherwise.
 * The first time this function is invoked, the right-to-left rendering property
 * is set if it has not been already.
 * @return {boolean} Whether the control is rendered right-to-left.
 */
goog.ui.Component.prototype.isRightToLeft = function() {
  if (this.rightToLeft_ == null) {
    this.rightToLeft_ = goog.style.isRightToLeft(this.inDocument_ ?
        this.element_ : this.dom_.getDocument().body);
  }
  return /** @type {boolean} */(this.rightToLeft_);
};


/**
 * Set is right-to-left. This function should be used if the component needs
 * to know the rendering direction during dom creation (i.e. before
 * {@link #enterDocument} is called and is right-to-left is set).
 * @param {boolean} rightToLeft Whether the component is rendered
 *     right-to-left.
 */
goog.ui.Component.prototype.setRightToLeft = function(rightToLeft) {
  if (this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  this.rightToLeft_ = rightToLeft;
};


/**
 * Returns true if the component has children.
 * @return {boolean} True if the component has children.
 */
goog.ui.Component.prototype.hasChildren = function() {
  return !!this.children_ && this.children_.length != 0;
};


/**
 * Returns the number of children of this component.
 * @return {number} The number of children.
 */
goog.ui.Component.prototype.getChildCount = function() {
  return this.children_ ? this.children_.length : 0;
};


/**
 * Returns an array containing the IDs of the children of this component, or an
 * empty array if the component has no children.
 * @return {Array.<string>} Child component IDs.
 */
goog.ui.Component.prototype.getChildIds = function() {
  var ids = [];

  // We don't use goog.object.getKeys(this.childIndex_) because we want to
  // return the IDs in the correct order as determined by this.children_.
  this.forEachChild(function(child) {
    // addChild()/addChildAt() guarantee that the child array isn't sparse.
    ids.push(child.getId());
  });

  return ids;
};


/**
 * Returns the child with the given ID, or null if no such child exists.
 * @param {string} id Child component ID.
 * @return {goog.ui.Component?} The child with the given ID; null if none.
 */
goog.ui.Component.prototype.getChild = function(id) {
  // Use childIndex_ for O(1) access by ID.
  return (this.childIndex_ && id) ? (/** @type {goog.ui.Component} */
      goog.object.get(this.childIndex_, id)) || null : null;
};


/**
 * Returns the child at the given index, or null if the index is out of bounds.
 * @param {number} index 0-based index.
 * @return {goog.ui.Component?} The child at the given index; null if none.
 */
goog.ui.Component.prototype.getChildAt = function(index) {
  // Use children_ for access by index.
  return this.children_ ? this.children_[index] || null : null;
};


/**
 * Calls the given function on each of this component's children in order.  If
 * {@code opt_obj} is provided, it will be used as the 'this' object in the
 * function when called.  The function should take two arguments:  the child
 * component and its 0-based index.  The return value is ignored.
 * @param {function(this:T,?,number):?} f The function to call for every
 * child component; should take 2 arguments (the child and its index).
 * @param {T=} opt_obj Used as the 'this' object in f when called.
 * @template T
 */
goog.ui.Component.prototype.forEachChild = function(f, opt_obj) {
  if (this.children_) {
    goog.array.forEach(this.children_, f, opt_obj);
  }
};


/**
 * Returns the 0-based index of the given child component, or -1 if no such
 * child is found.
 * @param {goog.ui.Component?} child The child component.
 * @return {number} 0-based index of the child component; -1 if not found.
 */
goog.ui.Component.prototype.indexOfChild = function(child) {
  return (this.children_ && child) ? goog.array.indexOf(this.children_, child) :
      -1;
};


/**
 * Removes the given child from this component, and returns it.  Throws an error
 * if the argument is invalid or if the specified child isn't found in the
 * parent component.  The argument can either be a string (interpreted as the
 * ID of the child component to remove) or the child component itself.
 *
 * If {@code opt_unrender} is true, calls {@link goog.ui.component#exitDocument}
 * on the removed child, and subsequently detaches the child's DOM from the
 * document.  Otherwise it is the caller's responsibility to clean up the child
 * component's DOM.
 *
 * @see goog.ui.Component#removeChildAt
 * @param {string|goog.ui.Component|null} child The ID of the child to remove,
 *    or the child component itself.
 * @param {boolean=} opt_unrender If true, calls {@code exitDocument} on the
 *    removed child component, and detaches its DOM from the document.
 * @return {goog.ui.Component} The removed component, if any.
 */
goog.ui.Component.prototype.removeChild = function(child, opt_unrender) {
  if (child) {
    // Normalize child to be the object and id to be the ID string.  This also
    // ensures that the child is really ours.
    var id = goog.isString(child) ? child : child.getId();
    child = this.getChild(id);

    if (id && child) {
      goog.object.remove(this.childIndex_, id);
      goog.array.remove(this.children_, child);

      if (opt_unrender) {
        // Remove the child component's DOM from the document.  We have to call
        // exitDocument first (see documentation).
        child.exitDocument();
        if (child.element_) {
          goog.dom.removeNode(child.element_);
        }
      }

      // Child's parent must be set to null after exitDocument is called
      // so that the child can unlisten to its parent if required.
      child.setParent(null);
    }
  }

  if (!child) {
    throw Error(goog.ui.Component.Error.NOT_OUR_CHILD);
  }

  return /** @type {goog.ui.Component} */(child);
};


/**
 * Removes the child at the given index from this component, and returns it.
 * Throws an error if the argument is out of bounds, or if the specified child
 * isn't found in the parent.  See {@link goog.ui.Component#removeChild} for
 * detailed semantics.
 *
 * @see goog.ui.Component#removeChild
 * @param {number} index 0-based index of the child to remove.
 * @param {boolean=} opt_unrender If true, calls {@code exitDocument} on the
 *    removed child component, and detaches its DOM from the document.
 * @return {goog.ui.Component} The removed component, if any.
 */
goog.ui.Component.prototype.removeChildAt = function(index, opt_unrender) {
  // removeChild(null) will throw error.
  return this.removeChild(this.getChildAt(index), opt_unrender);
};


/**
 * Removes every child component attached to this one and returns them.
 *
 * @see goog.ui.Component#removeChild
 * @param {boolean=} opt_unrender If true, calls {@link #exitDocument} on the
 *    removed child components, and detaches their DOM from the document.
 * @return {!Array.<goog.ui.Component>} The removed components if any.
 */
goog.ui.Component.prototype.removeChildren = function(opt_unrender) {
  var removedChildren = [];
  while (this.hasChildren()) {
    removedChildren.push(this.removeChildAt(0, opt_unrender));
  }
  return removedChildren;
};
/**
 * @fileoverview A component to greet the user.
 * @author vorporeal@gmail.com (David Stern)
 */

goog.provide('examples.hello.GreetingComponent');

goog.require('goog.dom');
goog.require('goog.ui.Component');



/**
 * A simple goog.ui.Component that greets the user.
 * @param {string=} opt_greeting The string to greet the user with.
 * @param {goog.ui.DomHelper=} opt_domHelper DOM helper to use.
 * @extends {goog.ui.Component}
 * @constructor
 */
examples.hello.GreetingComponent = function(opt_greeting, opt_domHelper) {
  goog.ui.Component.call(this, opt_domHelper);

  /**
   * The greeting message to display.
   * @type {string}
   * @private
   */
  this.greeting_ = opt_greeting || 'Hello, World!';
};
goog.inherits(examples.hello.GreetingComponent, goog.ui.Component);


/** @override */
examples.hello.GreetingComponent.prototype.createDom = function() {
  this.decorateInternal(goog.dom.createElement('div'));
};


/** @override */
examples.hello.GreetingComponent.prototype.decorateInternal =
    function(element) {
  examples.hello.GreetingComponent.superClass_.decorateInternal.call(
      this, element);

  var greetingEl = goog.dom.createDom('h1', {'style': 'background-color:#EEE'},
      this.greeting_);
  goog.dom.appendChild(this.getElement(), greetingEl);
};


/**
 * Get the greeting string.
 * @return {string} The greeting string.
 */
examples.hello.GreetingComponent.prototype.getGreeting = function() {
  return this.greeting_;
};


/**
 * Set the greeting string.
 * @param {!string} greeting The greeting string.
 */
examples.hello.GreetingComponent.prototype.setGreeting = function(greeting) {
  this.greeting_ = greeting;
};
/**
 * @fileoverview A simple hello world application using Google Closure.
 * @author vorporeal@gmail.com (David Stern)
 */

goog.provide('examples.hello.start');

goog.require('examples.hello.GreetingComponent');
goog.require('goog.dom');


/**
 * The main entry point of the hello example.
 */
examples.hello.start = function() {
  var greeting = new examples.hello.GreetingComponent();
  greeting.setGreeting('What\'s up, motherfucker?');
  greeting.render(goog.dom.getElement(document.body));
};


/**
 * This ensures that the Closure compiler makes this variable externally
 * accessible.
 */
goog.exportSymbol('examples.hello.start', examples.hello.start);
