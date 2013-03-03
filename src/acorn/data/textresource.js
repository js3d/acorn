/**
 * @author David Stern (vorporeal@gmail.com)
 */

goog.provide('acorn.data.TextResource');

goog.require('acorn.data.Resource');
goog.require('goog.net.XhrIo');



/**
 * @param {string} name The name of the resource.
 * @param {string|goog.Uri} uri The URI at which this text file can be found.
 * @constructor
 * @extends {acorn.data.Resource}
 */
acorn.data.TextResource = function(name, uri) {
  goog.base(this, name, uri);
  
  /**
   * The resource's text.
   * @type {?string}
   * @private
   */
  this.text_ = null;
};
goog.inherits(acorn.data.TextResource, acorn.data.Resource);


/** @override */
acorn.data.TextResource.prototype.load = function() {
  goog.net.XhrIo.send(this.uri, goog.partial(function(resource, e) {
    var xhr = e.target;
    var success = resource.processText(xhr.getResponseText());
    if (success) {
      resource.loaded = true;
      resource.callback(resource.getText());
    } else {
      resource.errback(resource.getText());
    }
  }, this));
};


/**
 * @param {string} text
 * @return {boolean} Whether the text was processed successfully.
 */
acorn.data.TextResource.prototype.processText = function(text) {
  this.text_ = text;
  return true;
};


/**
 * @return {string} This resource's text.
 */
acorn.data.TextResource.prototype.getText = function() {
  return this.text_;
};
