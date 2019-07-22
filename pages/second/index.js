const app = getApp();
const scv = require("../../libs/scv/scv.js");
// wx.__scvModelBaseDir = "../../models/"; // models的目录相对于scv.js文件

Page(scv.observer({
  data: {
    title: 'wxscv全局状态管理',
    userInfo: scv.require("userinfo.js"),
    hasUserInfo: false,
  },
  onInput: function (e) {
    // 直接修改数据
    this.data.userInfo.nickName = e.detail.value;
  },
  changeNick: function () {
    // 更新model数据和view
    this.update();
  }
}))
