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
