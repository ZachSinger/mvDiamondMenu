/*:
* @plugindesc standardPlayer Standard UI Class specification
* @author standardplayer
*/


var Imported = Imported || {};
Imported.standardUI = 'standardUI';

var standardPlayer = standardPlayer || { params: {} };
standardPlayer.standardUI = standardPlayer.standardUI || { animations: [], active: true };

standardPlayer.standardUI.Parameters = PluginManager.parameters('standardPlayer.standardUI');

function sp_UIFactory(){
    throw new Error('This is a static class')
}

sp_UIFactory.uiProto = function(){
    return Object.create(sp_UI.prototype)
}


function sp_UI(){
    throw new Error('This is an abstract class')
}

sp_UI.prototype.constructor = sp_UI.prototype.build;

sp_UI.prototype.build = function(){
    this._initialized = false;
    this._stage = standardPlayer.sp_ImageCache.createContainer()
}



function sp_CheckBox(){
    this.build()
}

sp_CheckBox.prototype = sp_UIFactory.uiProto()

