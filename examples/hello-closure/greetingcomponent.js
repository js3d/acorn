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
