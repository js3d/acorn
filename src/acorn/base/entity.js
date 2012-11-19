/**
 * @fileoverview The Acorn entity class, comprising all in-game objects.
 * @author vorporeal@gmail.com (David Stern)
 */

goog.provide('acorn.base.Entity');

goog.require('acorn.base.Behavior');
goog.require('acorn.base.Component');



/**
 * The core object type in Acorn.  All objects are of type Entity, and are
 * functionally distinguished by the Components they have and the Behaviors that
 * apply to them.
 * @constructor
 */
acorn.base.Entity = function() {

  /**
   * The Components attached to this Entity.
   * @type {Object.<string, acorn.base.Component>}
   * @private
   */
  this.components_ = {};

};


/**
 * Check if this Entity supports a given behavior.
 * @param {acorn.base.Behavior} behavior The behavior to check for support with.
 * @return {boolean} True if this Entity contains the components required by the given
 *      behavior, false otherwise.
 */
acorn.base.Entity.prototype.supportsBehavior = function(behavior) {

};


/**
 * Attach a list of Behaviors to this Entity.
 * @param {Array.<acorn.base.Behavior>} behavior The Behaviors to attach.
 * @return {acorn.base.Entity} Return "this" to chain initialization calls.
 */
acorn.base.Entity.prototype.attachBehaviors = function(behaviors) {

};


/**
 * Enable a Behavior for this Entity.
 * @param {acorn.base.Behavior} behavior The Behavior to disable.
 * @return {acorn.base.Entity} Returns "this" to chain calls.
 */
acorn.base.Entity.prototype.enableBehavior = function(behavior) {

};


/**
 * Disable a Behavior for this Entity.
 * @param {acorn.base.Behavior} behavior The Behavior to disable.
 * @return {acorn.base.Entity} Returns "this" to chain calls.
 */
acorn.base.Entity.prototype.disableBehavior = function(behavior) {

};


/**
 * Attach a list of Components to this Entity.
 * @param {Array.<acorn.base.Component>} components The Components to attach.
 * @return {acorn.base.Entity} Return "this" to chain initialization calls.
 */
acorn.base.Entity.prototype.attachComponents = function(components) {
  
};


/**
 * Attach a Component to this Entity.
 * @param {acorn.base.Component} component The Component to attach.
 * @return {acorn.base.Entity} Return "this" to chain initialization calls.
 */
acorn.base.Entity.prototype.attachComponent = function(component) {
  if (goog.DEBUG && this.hasComponent(component)) {
    console.warn('Adding a component that already exists!');
  }
  this.components_[component.getComponentId()] = component;
};


/**
 * Check if this Entity contains a given Component.
 * @param {string} componentType The type of the Component.
 * @return True if this Entity has a Component of the given type, false
 *      otherwise.
 */
acorn.base.Entity.prototype.hasComponent = function(componentType) {
  return componentType.getComponentId() in this.components_;
};
