const app = getApp();
const scv = require("../../libs/scv/scv.js");
// wx.__scvModelBaseDir = "../../models/"; // models的目录相对于scv.js文件

Page(scv.observer({
  data: {
    userInfo: scv.require("userinfo.js"),
    hasUserInfo: false,
  },
  getUserInfo: function(e) {
    // 直接修改数据
    this.data.userInfo = e.detail.userInfo;
    this.data.hasUserInfo = true;
    // 更新model数据和view
    this.update();
  },
  onInput:function(e){
    // 直接修改数据
    this.data.userInfo.nickName = e.detail.value;
  },
  changeNick:function(){
    // 更新model数据和view
    this.update();  
  }
}))
