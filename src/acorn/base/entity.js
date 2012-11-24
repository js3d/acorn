/**
 * @fileoverview The Acorn entity class, comprising all in-game objects.
 * @author vorporeal@gmail.com (David Stern)
 */

goog.provide('acorn.base.Entity');

goog.require('acorn.base.Behavior');
goog.require('acorn.base.BehaviorManager');
goog.require('acorn.base.Component');
goog.require('goog.array');



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
 * Compare the IDs of two Entities.
 * @param {acorn.base.Entity} a The first Entity.
 * @param {acorn.base.Entity} b The second Entity.
 * @return {number} 1 if a>b, -1 if a<b, 0 otherwise.
 */
acorn.base.Entity.compare = function(a, b) {
  var aId = goog.getUid(a);
  var bId = goog.getUid(b);

  return aId > bId ? 1 : aId < bId ? -1 : 0;
};


/**
 * Check if this Entity supports a given behavior.
 * @param {!acorn.base.Behavior} behavior The behavior to check for support with.
 * @return {boolean} True if this Entity contains the components required by the given
 *      behavior, false otherwise.
 */
acorn.base.Entity.prototype.supportsBehavior = function(behavior) {
  if (goog.isDefAndNotNull(behavior)) {
    return goog.array.every(behavior.getRequiredComponents(), this.hasComponent,
        this);
  }
  return false;
};


/**
 * Enable a Behavior for this Entity.
 * @param {acorn.base.Behavior} behavior The Behavior to disable.
 * @return {acorn.base.Entity} Returns "this" to chain calls.
 */
acorn.base.Entity.prototype.enableBehavior = function(behavior) {
  if (this.supportsBehavior(behavior)) {
    var behaviorManager = acorn.base.BehaviorManager.getInstance();
    behaviorManager.enableFor(behavior, this);
  }
  return this;
};


/**
 * Disable a Behavior for this Entity.
 * @param {acorn.base.Behavior} behavior The Behavior to disable.
 * @return {acorn.base.Entity} Returns "this" to chain calls.
 */
acorn.base.Entity.prototype.disableBehavior = function(behavior) {
  var behaviorManager = acorn.base.BehaviorManager.getInstance();
  behaviorManager.disableFor(behavior, this);
  return this;
};


/**
 * Attach a list of Components to this Entity.
 * @param {!Array.<acorn.base.Component>} components The Components to attach.
 * @return {acorn.base.Entity} Return "this" to chain initialization calls.
 */
acorn.base.Entity.prototype.attachComponents = function(components) {
  goog.array.forEach(components, this.attachComponent, this);
  return this;
};


/**
 * Attach a Component to this Entity.
 * @param {!acorn.base.Component} component The Component to attach.
 * @return {acorn.base.Entity} Return "this" to chain initialization calls.
 */
acorn.base.Entity.prototype.attachComponent = function(component) {
  this.components_[component.getComponentId()] = component;
  return this;
};


/**
 * Check if this Entity contains a given Component.
 * @param {Object} componentType The type of the Component.
 * @return True if this Entity has a Component of the given type, false
 *      otherwise.
 */
acorn.base.Entity.prototype.hasComponent = function(componentType) {
  return componentType.getComponentId() in this.components_;
};


/**
 * Get a Component attached to this Entity.
 * @param {Object} componentType The type of Component we want to get.
 * @return {acorn.base.Component} The Component of the given type that is
 *      attached to this Entity; null if the Entity doesn't have one.
 */
acorn.base.Entity.prototype.getComponent = function(componentType) {
  var c = this.components_[componentType.getComponentId()];
  return c ? c : null;
};
