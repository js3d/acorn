/**
 * @fileoverview This pulls in the core Acorn classes as dependencies, so they
 *      can be manually tested in a JavaScript console.
 * @author vorporeal@gmail.com (David Stern)
 */

goog.provide('examples.basetest.start');

goog.require('acorn.base.Entity');


/**
 * The main entry point of the base-test example.
 */
examples.basetest.start = function() {
  // Do nothing.  We're just trying to load the base files to test them
  // in a browser console.
  console.log('Acorn core loaded.')
};


/**
 * This ensures that the Closure compiler makes this variable externally
 * accessible.
 */
goog.exportSymbol('examples.basetest.start', examples.basetest.start);
