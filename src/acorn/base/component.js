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
  if (goog.DEBUG) {
    /**
     * Whether or not this Component is valid.
     * @type {boolean}
     */
    this.isValid = false;

    this.validate();
  }
};


/**
 * Set up class-level properties of a Component.
 * @param {Object} component The component class to set up.
 */
acorn.base.Component.initialize = function(component) {
  component.prototype.getComponentId = goog.partial(goog.getUid, component);
};


/**
 * Validate that a Component has been properly initialized.
 *
 * This function will print warnings to the console for each validation check
 * that fails.
 * @param {acorn.base.Component} component The Component object to validate.
 */
acorn.base.Component.prototype.validate = function() {
  this.isValid = true;
  if (!goog.isFunction(this.getComponentId)) {
    console.warn('Component is missing getComponentId() function!');
    this.isValid = false;
  }

  if (!this.isValid) {
    console.warn('Component not valid!  Did you forget to call ' +
        'acorn.base.Component.initialize()?');
  }
};
