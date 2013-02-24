/**
 * @fileoverview The base class for all Acorn components.
 * @author vorporeal@gmail.com (David Stern)
 */

goog.provide('acorn.base.Component');
goog.provide('acorn.base.TestComponent');



/**
 * The Component base class.  This provides the basic utilities that all
 * components need to initialize and manage themselves.
 * @constructor
 */
acorn.base.Component = function() {

};


/**
 * @return {number} The ID of this component's type.
 */
acorn.base.Component.prototype.getComponentId = function() {
  return goog.getUid(this.constructor);
};


/**
 * Return the full, unique name of the component.
 * 
 * This would be 'acorn.base.Component' here, but we make this abstract
 * to ensure that subclasses implement it.
 * @return {string} The component's full name.
 */
acorn.base.Component.prototype.getFullName = goog.abstractMethod;


/**
 * The shortened name of the component.
 * 
 * The default implementation is everything after the last period in the
 * component's full name.
 * @return {string} The component's short name.
 */
acorn.base.Component.prototype.getShortName = function() {
  var name = this.getFullName();
  return name.slice(name.lastIndexOf('.') + 1);
};



/**
 * An implementation of acorn.base.Component for testing purposes.
 * @constructor
 */
acorn.base.TestComponent = function() {
  goog.base(this);
};
goog.inherits(acorn.base.TestComponent, acorn.base.Component);

acorn.base.TestComponent.FULL_NAME = 'acorn.base.TestComponent';
acorn.base.TestComponent.SHORT_NAME = 'TestComponent';

acorn.base.TestComponent.prototype.getFullName = function() {
  return acorn.base.TestComponent.FULL_NAME;
};