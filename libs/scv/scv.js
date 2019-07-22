/**
 *说明：
 *  全局数据状态管理基础类，跨页面数据共享和同步。作用类似于mobx和redux和vuex。
 *  上面说到的有小程序移植版本，但是毕竟不是针对性开发，tencent有自己的实现库westore非常适应小程序的架构，已经非常好了。 但是westore依然封装了Page，很多小程序已经用了自己的框架或者重写了Page
 *  为了更加无耦合的使用，和更加符合数据model层的使用，开发了本库，只实现了最最基本的功能，和另外一种使用方式。另外也借用了westore的json diff库
 *  所有model数据同步的生命周期是小程序的生命周期，所以请做好
 * 
 *example:
 *  wx.__scvModelBaseDir = "../../models/";     //相对于scv.js文件
 *  Page(scv.observer{                          //初始化参数
 *    data:{
 *      userinfo: scv.require("userinfo.js")    //引入model
 *    },
 *    test:function(){
 *      this.data.userinfo.nickName = "awen";   //设置数据
 *      this.update();                          //更新数据
 *    },
 *    ...
 *  })
 * 
 */
import diff from './diff'

let GlobalDatas = {}; //存储数据
if (!('__scvModelBaseDir' in wx)) {
  wx.__scvModelBaseDir = "../../models/";
  wx._scvtest = function(){
    console.log("GlobalDatas:",GlobalDatas);
  }
}
/**
 * 数据观察者
 * 用于页面上的options处理，主要用于将页面和数据关联绑定
 */
function _observer(option) {
  // 重写onLoad
  const onLoad = option.onLoad;
  option.onLoad = function (e) {
    this.scvInfo = {
      modelRelations: {},
      originData: null
    };
    bindUpdate(this);
    // 遍历数据data更新对应的model
    for (let k in this.data) {
      let val = this.data[k];
      // 有_scvModelName的是require的model数据
      if (val._scvModelName) {
        this.scvInfo.modelRelations[k] = val._scvModelName;
        let model = GlobalDatas[val._scvModelName];
        // 更新对应的实际model数据
        this.data[k] = model.data;
      }
    }
    // this.scvInfo.originData = JSON.parse(JSON.stringify(this.data));
    
    onLoad && onLoad.call(this, e);
    if (Object.keys(this.scvInfo.modelRelations).length > 0) {
      _setdata(this);
    }
  }
  // 解决执行navigateBack或reLaunch时清除store.instances对应页面的实例
  const onUnload = option.onUnload
  option.onUnload = function () {
    onUnload && onUnload.call(this)
    this.scvInfo = null;
  }
  return option;
}

/**
 * 用户引入数据模型，并对其进行初始化
 * 用于在页面上引入对应的全局数据模型，其实只是做了给数据标记模型名称并初始化的工作
 */
function _require(modelName) {
  // 取文件名为模块名，所以文件名不能随便改变，而且不能重复
  let model = GlobalDatas[modelName];
  if (!model) {
    // 初始化数据
    model = require(wx.__scvModelBaseDir + modelName);
    model._scvModelName = modelName;
    GlobalDatas[modelName] = model;
  }
  return model;
}

/**
 * 页面中的data可以直接使用：this.data.xxx = xxx; 的方法来设置。
 * 然后调用该方法就可以同步更新view。如果更新数据内部有model发生变化,包含该model的所有页面数据都回同步更新
 * params 可以传入，也可以不传入
 */
function bindUpdate(ctx) {
  ctx.update = function (params) {
    let diffResult = _setdata(this, params);
    if (Object.keys(diffResult).length > 0) {
      // 遍历keys看是否有与model绑定的数据，有责同步其他页面
      let modelNames = new Set();
      for (let diffkey in diffResult) {
        let relationKey = diffkey.split(".")[0];
        let modelName = this.scvInfo.modelRelations[relationKey];
        if (modelName && !modelNames.has(modelName)) {
          _syncModelValue(this, modelName, this.data[relationKey]);
          modelNames.add(modelName);
        }
      }
      modelNames = null;
    }
  }
}

// 更新当前页数据
function _setdata(ctx, params) {
  // 如果传入了数据
  if (params) {
    for (let key in params) {
      updateByPath(ctx.data, key, params[key])
    }
  }
  // 检查与原始数据的不同
  // debugger;
  let diffResult = diff(ctx.data, ctx.scvInfo.originData);
  // console.log('diff', diffResult);

  if (Object.keys(diffResult)[0] == '') {
    diffResult = diffResult[''];
  }
  if (Object.keys(diffResult).length > 0) {
    // 更新当前页view
    ctx.setData(diffResult, () => {
      ctx.scvInfo.originData = JSON.parse(JSON.stringify(ctx.data))
    });
  }
  return diffResult;
}
// 同步更新所有page的相关model
function _syncModelValue(ctx, modelName, modelData) {
  // console.log("sync", modelName, modelData);
  // 更新缓存
  GlobalDatas[modelName].data = modelData;
  // 遍历所有页面，不再更新当前页
  let pages = getCurrentPages();
  for (let i = pages.length - 1; i >= 0; i--) {
    if (!("scvInfo" in pages[i])) {
      continue;
    }
    let page = pages[i];
    let modelRelations = page.scvInfo.modelRelations;
    for (let relationKey in modelRelations) {
      if (modelRelations[relationKey] == modelName) {
        page.data[relationKey] = modelData;
      }
    }
    _setdata(page);
  }
  // 通知model数据变更
  _emitUpdate(modelName);
}
// 根据path来更新数据 - westore
function updateByPath(origin, path, value) {
  const arr = path.replace(/]/g, '').replace(/\[/g, '.').split('.')
  let current = origin
  for (let i = 0, len = arr.length; i < len; i++) {
    if (i === len - 1) {
      current[arr[i]] = value
    } else {
      current = current[arr[i]]
    }
  }
}
// model数据更新，通知模块
function _emitUpdate(modelName){
  let model = GlobalDatas[modelName];
  if(model.onUpdate){
    model.onUpdate();
  }
}

module.exports = {
  require: _require,
  observer: _observer,
};