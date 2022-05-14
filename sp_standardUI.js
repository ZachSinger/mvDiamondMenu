/*:
* @plugindesc standardPlayer Standard UI Class specification
* @author standardplayer
*/


var Imported = Imported || {};
Imported.standardUI = 'standardUI';

var standardPlayer = standardPlayer || { params: {} };
standardPlayer.standardUI = standardPlayer.standardUI || { animations: [], active: true };

standardPlayer.standardUI.Parameters = PluginManager.parameters('standardPlayer.standardUI');

function sp_UIFactory() {
    throw new Error('This is a static class')
}

sp_UIFactory.uiProto = function () {
    return Object.create(sp_UI.prototype)
}


function sp_UI() {
    throw new Error('This is an abstract class')
}

sp_UI.prototype.initialize = function () {
    throw new Error('Classes extending sp_UI should implement an initialize method')
}

sp_UI.prototype.constructor = sp_UI.prototype.build;

sp_UI.prototype.build = function () {
    this._initialized = false;
    this._stage = standardPlayer.sp_ImageCache.createContainer()
    this.initialize()
    this.preload()
}

sp_UI.prototype.preload = function () {
    if (this._filepaths) {
        this.setPreloader()
    }
}

sp_UI.prototype.setPreloader = function () {
    let filepaths = this._filepaths;
    this._loadedStubs = standardPlayer.sp_ImageCache.loadBatch("preloader", filepaths, () => { this.baseOnPreloaded() })
}

sp_UI.prototype.baseOnPreloaded = function () {
    this._isPreloaded = true;
    this.onPreloaded()
}

sp_UI.prototype.onPreloaded = function(){
    throw new Error('Classes extending sp_UI that set the ._filepaths property in the initalize method should have their own .onPreloaded method')
}



function sp_CheckBox() {
    this.build()
}

sp_CheckBox.prototype = sp_UIFactory.uiProto()

sp_CheckBox.prototype.initialize = function () {
    console.log('calling correct initialize')
    this._filepaths = ['characters/Actor1']
}

sp_CheckBox.prototype.onPreloaded = function(){
    console.log('finished preloading')
}

