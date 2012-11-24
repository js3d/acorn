/**
 * @fileoverview The base class for all Acorn components.
 * @author vorporeal@gmail.com (David Stern)
 */

goog.provide('acorn.base.Component');



/**
 * The Component base class.  This provides the basic utilities that all
 * components need to initialize and manage themselves.
 * @constructor
 */
acorn.base.Component = function() {

};


/**
 * @return {number} The ID of this component type.
 */
acorn.base.Component.getComponentId = function() {
  throw new Error('did not initialize component');
};


/**
 * @return {number} The ID of this component's type.
 */
acorn.base.Component.prototype.getComponentId = function() {
  return this.constructor.getComponentId();
};


/**
 * Set up class-level properties of a Component.
 * @param {Object} component The component class to set up.
 */
acorn.base.Component.initialize = function(component) {
  if (goog.DEBUG) {
    if (component == acorn.base.Component) {
      throw new Error("can't initialize Component base class");
    }
  }
  component.getComponentId = goog.partial(goog.getUid, component);
};
