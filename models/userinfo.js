/**
 * 返回的data为数据，onUpdate方法是数据发生变化的时候调用的回调方法
 */
let app = getApp();
// 初始化数据
let defData = app.globalData.userInfo;
// let defData = wx.getStorageSync(key)

module.exports = {
  // 数据
  data:defData,
  // 更新回调
  onUpdate:function(){
    console.log("onUpdate", this.data);
    app.globalData.userInfo = this.data;

    // 也可以进行一些其他的数据操作。
    // wx.setStorage({}) ...
    // or wx.request({})
  }
}