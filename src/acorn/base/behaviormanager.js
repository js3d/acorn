/**
 * @fileoverview The behavior manager class.
 * @author vorporeal@gmail.com (David Stern)
 */

goog.provide('acorn.base.BehaviorManager');

goog.require('acorn.base.Behavior');
goog.require('acorn.base.Entity');
goog.require('goog.array');



/**
 * The BehaviorManager class manages the mapping of behaviors to the list of
 * entities for which the behavior is enabled.
 * @constructor
 */
acorn.base.BehaviorManager = function() {

  /**
   * The Behavior to Entity list mapping.  All 
   * @type {{acorn.base.Behavior: Array.<acorn.base.Entity>}}
   * @private
   */
  this.behaviorEntityMap_ = {};
  
};
goog.addSingletonGetter(acorn.base.BehaviorManager);


/**
 * Check if a Behavior is enabled for a given Entity.
 * @return {boolean} true if enabled, false otherwise.
 */
acorn.base.BehaviorManager.prototype.isEnabledFor = function(behavior, entity) {
  var entityList = this.behaviorEntityMap_[behavior.getBehaviorId()];
  if (goog.isDefAndNotNull(entityList)) {
    return goog.array.binarySearch(entityList, entity,
        acorn.base.Entity.compare) > 0;
  } else {
    return false;
  }
};


/**
 * Enables or disables a given Behavior for one or more given Entity instances.
 * @param {!acorn.base.Behavior} behavior The Behavior to enable.
 * @param {acorn.base.Entity|Array.<acorn.base.Entity>} entities The Entity or
 *      Entity list to enable it on.
 * @param {boolean} opt_enable false to disable the Behavior, otherwise enable
 *      the Behavior.
 */
acorn.base.BehaviorManager.prototype.enableFor =
    function(behavior, entities, opt_enable) {
  if (!goog.isDefAndNotNull(behavior)) {
    return;
  }
  if (!goog.isDefAndNotNull(opt_enable)) {
    opt_enable = true;
  }
  if (!goog.isArray(entities)) {
    entities = [entities];
  }
  if(goog.DEBUG) {
    goog.array.forEach(entities, function(entity) {
      if (!goog.isDefAndNotNull(entity)) {
        console.warn('Passing undefined or null entity to ' +
            'BehaviorManager.enableFor()!');
      }
    });
  }
  var behaviorId = behavior.getBehaviorId();
  var entityList = this.behaviorEntityMap_[behaviorId];
  
  if (goog.isDefAndNotNull(entityList)) {
    var mutateFunc = opt_enable ?
        goog.array.binaryInsert : goog.array.binaryRemove;
    for (var i = 0; i < entities.length; i++) {
      mutateFunc(entityList, entities[i], acorn.base.Entity.compare);
    }
  } else if (opt_enable) {
    this.behaviorEntityMap_[behaviorId] = entities;
  }
};


/**
 * Disables a given Behavior for one or more given Entity instances.
 * This is syntatic sugar - it just calls enableFor().
 * @param {acorn.base.Behavior} behavior The Behavior to enable.
 * @param {acorn.base.Entity|Array.<acorn.base.Entity>} entities The Entity or
 *      Entity list to enable it on.
 */
acorn.base.BehaviorManager.prototype.disableFor = function(behavior, entities) {
  this.enableFor(behavior, entities, false);
};


/**
 * Get the list of Entities which have a given Behaivor enabled.
 * @param {acorn.base.Behavior} behavior The Behavior to get the list for.
 * @return {Array.<acorn.base.Entity>}
 */
acorn.base.BehaviorManager.prototype.getEntitiesWith(behavior) {
  return this.behaviorEntityMap_[behavior.getBehaviorId()];
};
