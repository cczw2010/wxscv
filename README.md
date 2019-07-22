# wxscv

微信小程序中，数据状态不同页面中不能跨页面同步更新，也就是缺失类似vuex,mobx,redux全局的数据状态管理功能。 有些人移植了这些库，但是毕竟不是微信小程序生态的东西。

tencent也发布了类似的库，叫做 [westore](https://github.com/Tencent/westore)，基于小程序开发，非常小巧好用。 但是由于重写了Page方法，而现在很多项目都有自己的框架（已经重写了Page方法等），重构代价较大， 所以参考实现了 **wxscv**。

###设计思路

想像model一样引入单独的数据模块，引入相同model的页面数据更新是同步的。 页面中的方法不重写Page,而是改为处理一下Page的option。

### 使用示例
	
	const scv = require("../../libs/scv/scv.js");
	Page(scv.observer({                          //初始化参数
     data:{
       userinfo: scv.require("userinfo.js")    //引入model
     },
     test:function(){
       this.data.userinfo.nickName = "awen";   //设置数据
       this.update();                          //更新数据
     },
     ...
     }))
     
 基本所有的api就在上面了。
 
 * **scv.observer**		初始化处理option
 * **scv.require** 		引入数据model文件名
 * **this.data.xx=xx** 直接修改数据
 * **this.update**		更新数据修改，包括更新view和同步model修改到所有页面

### Model文件

>model以文件的方式存在，单独建立一个文件夹来存放model文件。默认的是 根目录下的models文件夹。如果要修改wxscv库文件或者models文件的存放默认位置。可以使用：**wx.__scvModelBaseDir="xxxx"** 来设定models文件夹的路径，值得注意的是这是相对于scv.js文件的相对位置。

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
	

返回的对象分两部分

* data 返回的数据部分
* onUpdate model的数据修改后会调用该方法，可以在此处做一些数据或者业务操作


全部就这些了。
