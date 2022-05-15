/*:
* @plugindesc standardPlayer PIXI imageCache
* @author standardplayer
* @target MZ
* @base sp_Core
* @orderAfter sp_Core
*/


var Imported = Imported || {};
Imported.sp_ImageCache = 'sp_ImageCache';

var standardPlayer = standardPlayer || { params: {} };
standardPlayer.sp_ImageCache = standardPlayer.sp_ImageCache || {
    containers: [],
    sprites: [],
    graphics: [],
    text: [],
    batches: [],
    batchCbs: {},
    batchArgs:[],
    isLoaded: false,
    active: true,
    pixiVersion: Number((PIXI.VERSION.split(''))[0]),
    loadType: this.pixiVersion == 4 ? 'hasLoaded' : 'valid'
};

standardPlayer.sp_Core.addBaseUpdate(() => {
    let thisObject = standardPlayer.sp_ImageCache;
    if (thisObject.active)
        thisObject.run();
})

standardPlayer.sp_ImageCache.Parameters = PluginManager.parameters('standardPlayer.sp_ImageCache');

standardPlayer.sp_ImageCache.loadSharedSprite = function (url, cb, args) {
    let id = `sprite:${this.generateUUID()}`
    let stub = new SpriteStub(id);
    let spr = new PIXI.Sprite.from(`img/${url}.png`);

    stub.setName(url)
    
    if(typeof cb == 'undefined')
        cb = ()=>{};

    spr.cacheStub = stub;
    spr.sp_image_cacheId = id;
    spr.onCacheLoad = cb
    spr.onCacheArgs = args;
    spr.sp_image_cache_stub = stub
    spr.setRow = this.setRow.bind(spr)
    spr.setCol = this.setCol.bind(spr)
    spr.setRowCol = this.setRowCol.bind(spr)
    spr.setGridData = this.setGridData.bind(spr)
    spr.isShared = true;
    this.sprites.push(spr)
    this.active = true

    return stub;
}

standardPlayer.sp_ImageCache.loadSprite = function(url, cb, args){
    let id = `sprite:${this.generateUUID()}`
    let stub = new SpriteStub(id);
    let spr = new PIXI.Sprite.from(this.createTexture(`img/${url}.png`));

    stub.setName(url)

    if(typeof cb == 'undefined')
        cb = ()=>{};

    spr.cacheStub = stub;
    spr.sp_image_cacheId = id;
    spr.onCacheLoad = cb;
    spr.onCacheArgs = args;
    spr.sp_image_cache_stub = stub
    spr.setRow = this.setRow.bind(spr)
    spr.setCol = this.setCol.bind(spr)
    spr.setRowCol = this.setRowCol.bind(spr)
    spr.setGridData = this.setGridData.bind(spr)
    this.sprites.push(spr)
    this.active = true

    return stub;
}

standardPlayer.sp_ImageCache.loadTilingSprite = function(url, cb, args){
    let id = `sprite:${this.generateUUID()}`
    let stub = new TilingSpriteStub(id);
    let txt = this.createTexture(`img/${url}.png`);
    let spr = new PIXI.TilingSprite(txt);
    let aliasCB = ()=>{
        spr.width = txt.baseTexture.width;
        spr.height = txt.baseTexture.height;
        cb.call(spr);
    }

    stub.setName(url)

    if(typeof cb == 'undefined')
        cb = ()=>{};

    spr.cacheStub = stub;
    spr.sp_image_cacheId = id;
    spr.onCacheLoad = aliasCB;
    spr.onCacheArgs = args;
    this.sprites.push(spr)
    this.active = true

    return stub;
}

standardPlayer.sp_ImageCache.loadBatch = function(name, list, cb, args){
    let length = list.length;
    let stubs = [];
    if(!cb){
        cb = ()=> {}
    }

    for(let i = 0; i < length; i++){
        stubs.push(this.loadSprite(list[i]))
        stubs[i].retrieve().sp_image_cache_batch = name;
    }
    this.batches.push(name)
    this.batchCbs.push(cb)
    this.batchArgs.push(args)

    return stubs;
}

standardPlayer.sp_ImageCache.setRow = function(row){
    let sprite = this;
    let singleHeight = sprite.height;
    let singleWidth = sprite.width;

    if(!this.gridData)
        this.gridData = {row:0, col:0, rowMax:3, colMax:2}
    row = Math.max(Math.min(row, this.gridData.rowMax), 0);    
    this.gridData.row = row;

    sprite.texture.frame = new Rectangle(sprite.texture.frame.x, singleHeight * row, singleWidth, singleHeight)
}

standardPlayer.sp_ImageCache.setCol = function(col){
    let sprite = this;
    let singleHeight = sprite.height;
    let singleWidth = sprite.width;

    if(!this.gridData)
        this.gridData = {row:0, col:0, rowMax:3, colMax:2}
    col = Math.max(Math.min(col, this.gridData.colMax), 0);    
    this.gridData.col = col;

    sprite.texture.frame = new Rectangle( singleWidth * col, sprite.texture.frame.y, singleWidth, singleHeight)
}

standardPlayer.sp_ImageCache.setRowCol = function(row, col){
    this.setRow(row);
    this.setCol(col);
}

standardPlayer.sp_ImageCache.setGridData = function(rows, cols){
    let sprite = this;

    if(!this.gridData)
        this.gridData = {row:0, col:0, rowMax:rows - 1, colMax:cols - 1}

    sprite.texture.frame = new Rectangle(0, 0, sprite.texture.baseTexture.width / cols, sprite.texture.baseTexture.height / rows)
        return this;
}

standardPlayer.sp_ImageCache.loadSharedBatch = function(name, list, cb, args){
    let length = list.length;
    let stubs = [];
    if(!cb){
        cb = ()=> {}
    }

    for(let i = 0; i < length; i++){
        stubs.push(this.loadSharedSprite(list[i]))
        stubs[i].retrieve().sp_image_cache_batch = name;
    }
    this.batches.push(name)
    this.batchCbs.push(cb)
    this.batchArgs.push(args)

    return stubs;
}

standardPlayer.sp_ImageCache.loadNSprites = function(name, url, qty, cb, args){
    let arr = Array.apply(null, Array(qty)).map(()=>{return url})
    return this.loadBatch(name, arr, cb, args);
}

standardPlayer.sp_ImageCache.loadNSharedSprites = function(name, url, qty, cb, args){
    let arr = Array.apply(null, Array(qty)).map(()=>{return url})
    return this.loadSharedBatch(name, arr, cb, args);
}

standardPlayer.sp_ImageCache.createTexture = function(url){
    if(typeof PIXI.utils.TextureCache[url] != 'undefined'){ //If the texture exists
        return new PIXI.Texture(PIXI.utils.TextureCache[url])
    }
    return new PIXI.Texture.from(url)
}

standardPlayer.sp_ImageCache.createContainer = function(particle, max, options, batchSize, autoResize){
    let container = particle ? new PIXI.ParticleContainer(max, options, batchSize, autoResize) : new PIXI.Container;
    let id = `container:${this.generateUUID()}`
    let stub = new ContainerStub(id)

    container.cacheStub = stub;
    container.sp_image_cacheId = id;
    this.containers.push(container)
    return stub;
}

standardPlayer.sp_ImageCache.createGraphic = function(){
    let graphic = new PIXI.Graphics;
    let id = `graphic:${this.generateUUID()}`
    let stub = new GraphicStub(id)

    graphic.cacheStub = stub;
    graphic.sp_image_cacheId = id;
    this.graphics.push(graphic)
    return stub;
}

standardPlayer.sp_ImageCache.createText = function(content, style){
    let text = new PIXI.Text(content, style);
    let id = `text:${this.generateUUID()}`
    let stub = new TextStub(id)

    text.cacheStub = stub
    text.sp_image_cacheId = id;
    this.text.push(text)
    return stub;
}


//returns true if it find the same texture as the sprite on the stub provided, but on a different sprite in the cache
standardPlayer.sp_ImageCache.textureInUse = function(stub){
    let texture = stub.retrieve().texture;
    let baseTexture = texture.baseTexture;
    let shared = stub.retrieve().isShared;
    let list = this.sprites;
    let length = list.length;

    for(let i = 0; i < length; i++){
        if(shared){
            if(list[i].texture.baseTexture === baseTexture && list[i].sp_image_cache_stub.sp_image_cacheId !== stub.sp_image_cacheId){
                    return true
            }
        } else if(list[i].texture.baseTexture === baseTexture && list[i].texture !== texture){ 

            if(list[i].parent){
                return true
            }
        }
    }

    return false
}

standardPlayer.sp_ImageCache.deleteSprite = function(stub){
    let list = this.sprites;
    let length = list.length;
    let newList = [];
    let toDelete = [];

    for(let i = 0; i < length; i++){
        if(list[i].sp_image_cacheId == stub.sp_image_cacheId){
            list[i].destroy(!this.textureInUse(stub)) 
            list[i] = undefined    
        } else {
            newList.push(list[i])
        }
    }

    this.sprites = newList;
}

standardPlayer.sp_ImageCache.deleteGraphic = function(stub){
    let list = this.graphics;
    let index = standardPlayer.sp_Core.retrieveFromList(list, (item)=>{
        return item == stub.retrieve();
    })[0]

    list[index].destroy(true)
    list.splice(index, 1)
    
}

standardPlayer.sp_ImageCache.deleteText = function(stub){
    let list = this.text;
    let index = standardPlayer.sp_Core.retrieveFromList(list, (item)=>{
        return item == stub.retrieve();
    })[0]

    list[index].destroy(true)
    list.splice(index, 1)
}


standardPlayer.sp_ImageCache.deleteContainer = function(stub){
    let list = this.containers;
    let length = list.length;
    let newList = [];
    let toDelete = [];

    for(let i = 0; i < length; i++){
        if(list[i].sp_image_cacheId == stub.sp_image_cacheId){
            this.destroyContainerChildren(list[i]);
            list[i].destroy(true) 
            list[i] = undefined
        } else {
            newList.push(list[i])
        }
    }
    this.containers = newList;
}

standardPlayer.sp_ImageCache.destroyContainerChildren = function(container){
    let spr;

    while(container.children.length > 0){
        spr = container.removeChildAt(0);
        this.deleteSprite(
            {retrieve: ()=>{
                return spr;
            },
            sp_image_cacheId: spr.sp_image_cacheId
            })
        spr = undefined;
    }
}

standardPlayer.sp_ImageCache.refreshIds = function(type){
    let list = ""

    switch(type){
        case 'sprite':
            list = 'sprites'
            break;
        case 'container':
            list = 'containers'
            break;
        case 'graphic':
            list = 'graphics'
            break;
        case 'text':
            list = 'text'
            break;
        default:
    }

    this.performRefresh(list)
}

standardPlayer.sp_ImageCache.performRefresh = function(listName){
    let list = this[listName]
    let length = list.length;

    for(let i = 0; i < length; i++){
        list[i].cacheStub.imageCacheIndex = i
    }
}

standardPlayer.sp_ImageCache.retrieveEntity = function (sp_image_cacheId) {
    switch (true) {
        case sp_image_cacheId.contains('sprite'):
            return this.retrieveSprite(sp_image_cacheId)[1]

        case sp_image_cacheId.contains('container'):
            return this.retrieveContainer(sp_image_cacheId)[1]

        case sp_image_cacheId.contains('graphic'):
            return this.retreiveGraphic(sp_image_cacheId)[1]

        case sp_image_cacheId.contains('text'):
            return this.retreiveText(sp_image_cacheId)[1]

        default:
            console.log('not recognized id')
    }
}

standardPlayer.sp_ImageCache.retrieveSprite = function (sp_image_cacheId) {
    return standardPlayer.sp_Core.retrieveFromList(this.sprites, (sprite) => {
        return sprite.sp_image_cacheId == sp_image_cacheId
    })
}

standardPlayer.sp_ImageCache.retrieveContainer = function (sp_image_cacheId) {
    return standardPlayer.sp_Core.retrieveFromList(this.containers, (container) => {
        return container.sp_image_cacheId == sp_image_cacheId
    })
}

standardPlayer.sp_ImageCache.retreiveGraphic = function (sp_image_cacheId) {
    return standardPlayer.sp_Core.retrieveFromList(this.graphics, (graphic) => {
        return graphic.sp_image_cacheId == sp_image_cacheId
    })
}

standardPlayer.sp_ImageCache.retreiveText = function (sp_image_cacheId) {
    return standardPlayer.sp_Core.retrieveFromList(this.text, (text) => {
        return text.sp_image_cacheId == sp_image_cacheId
    })
}

standardPlayer.sp_ImageCache.generateUUID = function(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
    return uuid
}

standardPlayer.sp_ImageCache.run = function(){
    this.isReady();
    if(this.isLoaded)
        this.active = false;
}

standardPlayer.sp_ImageCache.isReady = function(){
    this.isLoaded = this.allSpritesLoaded()
}

standardPlayer.sp_ImageCache.allSpritesLoaded = function(){
    let list = this.sprites;
    let length = list.length;
    let loaded = true;
    let current;
    let batches = [];

    for(let i = 0; i < length; i++){
        current = list[i]
        if(typeof current.sp_image_loaded == 'undefined'){
            loaded = false;
            if(current.sp_image_cache_batch){
                    batches[current.sp_image_cache_batch] = true;
                }
            if(current.texture && current.texture.baseTexture && current.texture.baseTexture[this.loadType]){
                current.sp_image_loaded = true;
                current.onCacheLoad(current.onCacheArgs);
            } else {
                console.log('reaching')
                if(current.sp_image_cache_batch){
                    batches[current.sp_image_cache_batch] = true;
                }
            }
        } 
    }

    this.checkBatches(batches);
    return loaded;
}

//the batches arg contains a list of batch names that are NOT READY to be called 
standardPlayer.sp_ImageCache.checkBatches = function(batches){
    let list = this.batches;
    let cbs = this.batchCbs;
    let args = this.batchArgs;
    let length = list.length;
    let fleeceList = [];

    for(let i = 0; i < length; i++)   {
        if(batches[list[i]])
            continue
        
        cbs[i](args[i])
        fleeceList.push(i)
    }

    this.fleeceCallbacks(fleeceList)
}

standardPlayer.sp_ImageCache.fleeceCallbacks = function(fleeceList){
    let batches = this.batches;
    let cbs = this.batchCbs;
    let args = this.batchArgs; 
    let length = batches.length;
    let newBatches = []
    let newCbs = [];
    let newArgs = [];


    for(let i = 0; i < length; i++){
        if(fleeceList.contains(i))
            continue;

        newBatches.push(batches[i])
        newCbs.push(cbs[i])
        newArgs.push(args[i])
    }

    this.batches = newBatches;
    this.batchCbs = newCbs;
    this.batchArgs = newArgs;

}
/* ===================================================================================================
        Stub classes
 ===================================================================================================*/



class CacheStub {
    constructor(id) {
        this.sp_image_cacheId = id
        this.ref = this.retrieve.bind(this)
        Object.defineProperty(this, 'stub', {
            get:()=> {return this.retrieve()}
        })
    }

    retrieve() {
        return standardPlayer.sp_ImageCache[this._cacheType][this.imageCacheIndex]
    }

    setName(name){
        this._name = name
    }

    name(){
        return this._name
    }

    addChild(stub){
        this.stub.addChild(stub.stub)
    }

    setInteractive(){
        let obj = this.stub
        let bounds = obj.getLocalBounds();
        obj.interative = true;
        obj.hitArea = new PIXI.Rectangle(0, 0, bounds.width, bounds.height)
        obj.on('mousedown', ()=> console.log('hit'))
    }

}


class SpriteStub extends CacheStub {
    constructor(id){
        super(id)
        this._name = "";
        this._cacheType = 'sprites'
        this.imageCacheIndex = standardPlayer.sp_ImageCache.sprites.length;
    }

    delete(){
        standardPlayer.sp_ImageCache.deleteSprite(this)
        standardPlayer.sp_ImageCache.refreshIds('sprite')
    }
}

class TilingSpriteStub extends CacheStub {
    constructor(id){
        super(id)
        this._name = "";
        this._cacheType = 'sprites'
        this.imageCacheIndex = standardPlayer.sp_ImageCache.sprites.length;
    }

    delete(){
        standardPlayer.sp_ImageCache.deleteSprite(this)
        standardPlayer.sp_ImageCache.refreshIds('sprite')
    }
}

class ContainerStub extends CacheStub {
    constructor(id){
        super(id)
        this._name = ""
        this._cacheType = 'containers'
        this.imageCacheIndex = standardPlayer.sp_ImageCache.containers.length;
    }

    delete(){
        standardPlayer.sp_ImageCache.deleteContainer(this)
        standardPlayer.sp_ImageCache.refreshIds('container')
    }

    add(stub){
        this.retrieve().addChild(stub.retrieve())
    }

    remove(stub){
        this.retrieve().removeChild(stub.retrieve())
    }
}

class GraphicStub extends CacheStub {
    constructor(id){
        super(id)
        this._cacheType = 'graphics'
        this.imageCacheIndex = standardPlayer.sp_ImageCache.graphics.length;
    }

    delete(){
        standardPlayer.sp_ImageCache.deleteGraphic(this)
        standardPlayer.sp_ImageCache.refreshIds('graphic')
    }
}
    
class TextStub extends CacheStub {
    constructor(id){
        super(id)
        this._cacheType = 'text'
        this.imageCacheIndex = standardPlayer.sp_ImageCache.text.length;
    }

    delete(){
        standardPlayer.sp_ImageCache.deleteText(this)
        standardPlayer.sp_ImageCache.refreshIds('text')
    }

    setText(text, measure){
        this.stub.text = text;
        if(measure){
            this.stub.met = PIXI.TextMetrics.measureText(text, this.stub._style)
        }
    }

    center(){
        if(this.stub.met){
            this.stub.pivot.set(this.stub.met.width / 2, this.stub.met.height / 2)
            
        }
    }
}

/* ===================================================================================================
        Scene and Window classes
 ===================================================================================================*/

 standardPlayer.sp_ImageCache.alias_SceneBase_Start = Scene_Base.prototype.start;
 standardPlayer.sp_ImageCache.alias_WindowBase_Start = Window_Base.prototype.start;

 Scene_Base.prototype.preload = function(images){
    this._loadedStubs = standardPlayer.sp_ImageCache.loadBatch("preloader", images, ()=>{this.onPreloaded()})
 }

 Scene_Base.prototype.onPreloaded = function(){
    this._isPreloaded = true;
 }


 Window_Base.prototype.preload = function(images){
    this._loadedStubs = standardPlayer.sp_ImageCache.loadBatch("preloader", images, ()=>{this.onPreloaded()})
 }

 Window_Base.prototype.onPreloaded = function(){
    return true;
 }



