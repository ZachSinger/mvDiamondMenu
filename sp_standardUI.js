/*:
* @plugindesc standardPlayer Standard UI Class specification
* @author standardplayer
*/


var Imported = Imported || {};
Imported.standardUI = 'standardUI';

var standardPlayer = standardPlayer || { params: {} };
standardPlayer.standardUI = standardPlayer.standardUI || { animations: [], active: true };

standardPlayer.standardUI.Parameters = PluginManager.parameters('standardPlayer.standardUI');


/*===================================================================================================== 
  ____                 
 |  _ \                
 | |_) | __ _ ___  ___ 
 |  _ < / _` / __|/ _ \
 | |_) | (_| \__ \  __/
 |____/ \__,_|___/\___|
=====================================================================================================*/
function sp_UIFactory() {
    throw new Error('This is a static class')
}

sp_UIFactory.uiProto = function () {
    return Object.create(sp_UI.prototype)
}

sp_UIFactory.containerProto = function () {
    return Object.create(sp_UIContainer.prototype)
}

sp_UIFactory.lineStyle = function () {
    return [2, 0xFFFFFF, 1]
}

sp_UIFactory.fill = function () {
    return 0x54aeba
}

sp_UIFactory.windowBackgroundStyler = function (graphicsStub) {
    let lineStyle = this.lineStyle()
    let fill = this.fill()

    console.log(graphicsStub)
    graphicsStub.stub.lineStyle(...lineStyle)
    graphicsStub.stub.beginFill(fill)
}


function sp_UI() {
    throw new Error('This is an abstract class')
}

sp_UI.prototype.initialize = function () {
    throw new Error('Classes extending sp_UI should implement an initialize method')
}

sp_UI.prototype.constructor = sp_UI.prototype.build;

sp_UI.prototype.build = function (args) {
    this.setProps()
    this.makeGettersAndSetters()
    this.setBackDimensions()
    this.createBackground()
    this.createTextContainer()
    this.initialize(...args)
    this.preload()
}

sp_UI.prototype.makeGettersAndSetters = function(){
    Object.defineProperty(this, 'x', {
        get:()=>{
            return this._stage.stub.x
        }, 
        set: (value)=>{
            this._stage.stub.x = value;
        }
    })

    Object.defineProperty(this, 'y', {
        get:()=>{
            return this._stage.stub.y
        }, 
        set: (value)=>{
            this._stage.stub.y = value;
        }
    })

    Object.defineProperty(this, 'width', {
        get:()=>{
            return this._stage.stub.width
        }, 
        set: (value)=>{
            this._stage.stub.width = value;
        }
    })

    Object.defineProperty(this, 'height', {
        get:()=>{
            return this._stage.stub.height
        }, 
        set: (value)=>{
            this._stage.stub.height = value;
        }
    })

    Object.defineProperty(this, 'visible', {
        get:()=>{
            return this._stage.stub.visible
        }, 
        set: (value)=>{
            this._stage.stub.visible = value;
        }
    })

    Object.defineProperty(this, 'alpha', {
        get:()=>{
            return this._stage.stub.alpha
        }, 
        set: (value)=>{
            this._stage.stub.alpha = value;
        }
    })
}

sp_UI.prototype.setProps = function () {
    this._initialized = false;
    this._stage = standardPlayer.sp_ImageCache.createContainer()
}

sp_UI.prototype.setBackDimensions = function () {
    this._backWidth = this.initialDrawWidth()
    this._backHeight = this.initialDrawHeight()
}

sp_UI.prototype.initialDrawWidth = function(){
    return Graphics.width * .2
}

sp_UI.prototype.initialDrawHeight = function(){
    return Graphics.width * .2
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

sp_UI.prototype.onPreloaded = function () {
    throw new Error('Classes extending sp_UI that set the ._filepaths property in the initalize method should have their own .onPreloaded method')
}

sp_UI.prototype.imageCache = function () {
    return standardPlayer.sp_ImageCache
}

sp_UI.prototype.createBackground = function () {
    let back = this.imageCache().createGraphic()

    sp_UIFactory.windowBackgroundStyler(back)
    back.stub.drawRect(0, 0, this._backWidth, this._backHeight)

    this._stage.addChild(back)
    this._back = back;
        
}

sp_UI.prototype.createTextContainer = function(){
    this._text = this.imageCache().createContainer()
    this._textObjects = {main: this.imageCache().createText()}

    this._text.addChild(this._textObjects.main)
    this._stage.addChild(this._text)
}

sp_UI.prototype.setPosition = function(x, y){
    y = y || x;
    this.x = x;
    this.y = y;
}

sp_UI.prototype.setDimensions = function(width, height){
    height = height || width;
    this.width = width;
    this.height = height;
}

sp_UI.prototype.stage = function () {
    return this._stage.stub
}

sp_UI.prototype.update = function () {
    
}

sp_UI.prototype.mouseCollision = function () {

    let bounds = this.stage().getBounds();

    return standardPlayer.sp_Core.collision(bounds)
}

sp_UI.prototype.isTriggered = function () {
    if(TouchInput.isTriggered()){
        return this.mouseCollision()
    }
}

sp_UI.prototype.isPressed = function () {
    if(TouchInput.isPressed()){
        return this.mouseCollision()
    }
}


/*=====================================================================================================
   _____            _        _                     
  / ____|          | |      (_)                    
 | |     ___  _ __ | |_ __ _ _ _ __   ___ _ __ ___ 
 | |    / _ \| '_ \| __/ _` | | '_ \ / _ \ '__/ __|
 | |___| (_) | | | | || (_| | | | | |  __/ |  \__ \
  \_____\___/|_| |_|\__\__,_|_|_| |_|\___|_|  |___/
=====================================================================================================*/

function sp_UIContainer(...args){
    this.build(args)
}

sp_UIContainer.prototype = sp_UIFactory.uiProto()

sp_UIContainer.prototype.initialize = function(showBackground){
    showBackground = showBackground || false;
    this.initializeMembers()
    this._back.stub.visible = showBackground
}

sp_UIContainer.prototype.initializeMembers = function(){
    this.children = [];
}

sp_UIContainer.prototype.addChild = function(...children){
    let index = -1;
    let length = children.length;
    
    for(let i = 0; i < length; i++){
        if(children[i].constructor != this._childType){
            console.log(`Cannot add objects of type ${children[i].constructor} ${this._childType}`)
            continue
        }

        index = this.children.indexOf(children[i])
        if(index < 0){
            this.children.push(children[i])
        }
        this._stage.addChild(children[i]._stage)
    }
}

sp_UIContainer.prototype.removeChild = function(child){
    let index = this.children.indexOf(child)

    if(index >= 0){
        this.children.splice(index, 1)
    }

    this._stage.removeChild(child._stage)
}

sp_UIContainer.prototype.updateChildren = function(){
    let list = this.children;
    let length = list.length;

    for(let i = 0; i < length; i++){
        list[i].update()
    }
}

sp_UIContainer.prototype.update = function(){
    sp_UI.prototype.update.call(this)
    this.updateChildren()
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function sp_Component(...args){
    this._childType = sp_UI
    this.build(args)
}

sp_Component.prototype = sp_UIFactory.containerProto()
sp_Component.prototype.constructor = sp_Component

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function sp_Area(...args){
    this._childType = sp_Component
    this.build(args)
}

sp_Area.prototype = sp_UIFactory.containerProto()
sp_Area.prototype.constructor = sp_Area


/*=====================================================================================================
  ______ _                           _       
 |  ____| |                         | |      
 | |__  | | ___ _ __ ___   ___ _ __ | |_ ___ 
 |  __| | |/ _ \ '_ ` _ \ / _ \ '_ \| __/ __|
 | |____| |  __/ | | | | |  __/ | | | |_\__ \
 |______|_|\___|_| |_| |_|\___|_| |_|\__|___/ 
 =====================================================================================================*/


function sp_CheckBox(...args) {
    this.build(args)
}

sp_CheckBox.prototype = sp_UIFactory.uiProto()
sp_CheckBox.prototype.constructor = sp_UI

sp_CheckBox.prototype.initialize = function (toggled) {
    this._toggled = toggled ? true : false
    console.log(toggled, this._toggled)
    this.draw()
}

sp_CheckBox.prototype.initialDrawWidth = function(){
    return Graphics.width * .04
}

sp_CheckBox.prototype.initialDrawHeight = function(){
    return Graphics.width * .04
}

sp_CheckBox.prototype.onPreloaded = function () {
    console.log('finished preloading')
}

sp_CheckBox.prototype.positionText = function(){
    let txt = this._textObjects.main.stub;
    let back = this._back.stub
    
    txt.position.set(back.width / 2, back.height / 2 )
    txt.y -= txt.height / 2
    txt.y -= txt.height / 16

    txt.x -= txt.width / 2
    txt.x -= txt.width / 16
}


sp_CheckBox.prototype.draw = function () {
    let content = this._toggled ? 'X' : '';
    this._textObjects.main.setText(content, true)

    this.positionText()
}

sp_CheckBox.prototype.update = function () {
    sp_UI.prototype.update.call(this)
    if (this.isTriggered()) {
        this.onCollision()
    }
}

sp_CheckBox.prototype.onCollision = function () {
    this._toggled = !this._toggled;
    this.draw()
}







