/**
 * @author David Stern (vorporeal@gmail.com)
 */

goog.provide('acorn.data.JsonResource');

goog.require('acorn.data.Resource');
goog.require('goog.net.XhrIo');



/**
 * @param {string} name The name of the resource.
 * @param {string|goog.Uri} uri The URI at which this JSON data can be found.
 * @constructor
 * @extends {acorn.data.Resource}
 */
acorn.data.JsonResource = function(name, uri) {
  goog.base(this, name, uri);
  
  /**
   * The resource's JSON response data.
   * @type {?string}
   * @private
   */
  this.json_ = null;
};
goog.inherits(acorn.data.JsonResource, acorn.data.Resource);


/** @override */
acorn.data.JsonResource.prototype.load = function() {
  goog.net.XhrIo.send(this.uri, goog.partial(function(resource, e) {
    var xhr = e.target;
    var success = resource.processJson(xhr.getResponseJson());
    if (success) {
      resource.loaded = true;
      resource.callback(resource.getJson());
    } else {
      resource.errback(resource.getJson());
    }
  }, this));
};


/**
 * @param {string} jsonData
 * @return {boolean} Whether the JSON was processed successfully.
 */
acorn.data.JsonResource.prototype.processJson = function(json) {
  this.json_ = json;
  return true;
};


/**
 * @return {string} This resource's JSON data.
 */
acorn.data.JsonResource.prototype.getJson = function() {
  return this.json_;
};
