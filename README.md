# react-wechat-api

[![CircleCI](https://circleci.com/gh/Cap32/react-wechat-api.svg?style=shield)](https://circleci.com/gh/Cap32/react-wechat-api)
[![Build Status](https://travis-ci.org/Cap32/react-wechat-api.svg?branch=master)](https://travis-ci.org/Cap32/react-wechat-api)
[![Coverage Status](https://coveralls.io/repos/github/Cap32/react-wechat-api/badge.svg?branch=master)](https://coveralls.io/github/Cap32/react-wechat-api?branch=master)
[![License](https://img.shields.io/badge/license-MIT_License-brightgreen.svg?style=flat)](https://github.com/Cap32/react-wechat-api/blob/master/LICENSE.md)

React Wechat JSSDK component for SPA

## Installation

```config
$ yarn add react-wechat-api
```

## Usage

**This example is using react-router v4, but it's not required by reacth-wechat-api**

**Wechat.js**

```jsx
import React from "react";
import { Route } from "react-router-dom";
import { WechatAPIProvider } from "react-wechat-api";
import wx from "weixin-js-sdk";

// 注意这里Promise和fetch在iOS 10.2上测试的时候，发现不好使，后来改为axios了

const getConfig = ({ url }) =>
  fetch(`https://aweso.me/api/wx?url=${url}`).then(res => res.json());
/* should return an object like {
  appId: "wx05d8cb9deee3c05c",
  nonceStr: "nw0y6jnq1ie",
  signature: "e50d96cb73c09ba1e5848456d1ae90ec1b7ccf43",
  timestamp: 1541346529448
} */

const defaultShareData = {
  title: "Wechat API",
  desc: "Wechat API component for react",
  link: () => window.location.href, // will return latest URL dynamically
  imgUrl: `${window.location.origin}/icon.png`
};

const defaultJsApiList = [
  "onMenuShareTimeline",
  "onMenuShareAppMessage",
  "onMenuShareQQ",
  "onMenuShareQZone"
];

export default function Wechat(props) {
  return (
    <Route>
      {({ location }) => (
        <WechatAPIProvider
          {...props}
          location={location} // <-- `location` is required
          wx={wx} // <-- `wx` is required
          getConfig={getConfig}
          jsApiList={defaultJsApiList}
          shareData={defaultShareData}
        />
      )}
    </Route>
  );
}
```

**App.js**

```jsx
import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import Wechat from "./Wechat";
import HomePage from "./containers/HomePage";

export default class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Wechat>
          <Route path="/" component={HomePage} />
          {/* other routes... */}
        </Wechat>
      </BrowserRouter>
    );
  }
}
```

**HomePage.js**

```jsx
import React, { Component } from "react";
import { WechatAPI } from "react-wechat-api";

export default class HomePage extends Component {
  state = {
    shareData: {
      title: "Awesome!!!"
    }
  };

  render() {
    return (
      <WechatAPI shareData={this.state.shareData}>
        <div>
          <h1>Awesome</h1>
        </div>
      </WechatAPI>
    );
  }
}
```

## iOS和Android在微信分享和支付的config有很大的区别
参考 [https://github.com/yongheng2016/blog/issues/78](https://github.com/yongheng2016/blog/issues/78)

### 微信分享要点
+ 微信公众平台 - 公众号设置 - 功能设置 - 业务域名 接口安全域名 网页授权域名
+ 分享路径只关心URL的问号?之前的路径，也就是页面路径，问号之后的query string微信根本不care
    + 我们做分享返利的时候，必须加上级的id，直接加到url后面就可以了，完全不影响
+ Android每换一个页面都要根据当前URL拿一下配置，然后再做wx.config
+ iOS只需要根据进入应用的第一个页面URL从服务器getConfig一下就好了，以后每个页面都可以拿以前的数据直接wx.config，这块需要自己判断和存储

### 微信支付要点
+ 商户平台 - 产品中心 - 开发配置 - 支付配置 - 支付授权目录
+ 目录是以/结尾的，所有/order/pay目录只需要配置到/order/就可以了
+ Android每个页面都独立配置，所以需要为Android配置一个支付授权目录
+ iOS是以进入应用第一个页面的URL做的配置，所以如果你的应用有很多入口，就需要配置多个。我的应用用户会分享主页，商品列表，商品详情，那就需要配置"/"、"/goods/"、"/detail/"等多个目录
+ VUE和React应用，用#做hash router也许是个更好的方案，毕竟微信不关注页面路径后面的东西

上面具体的实现，可以参考sample文件夹下的2个文件，是从我们项目中直接拷贝过来的，不能编译的话，需要自己梳理
其中Wechat.js实现了完整的授权流程，WechatAPIProvider.js实现了为每个分享添加参数，iOS也只需要一次获取配置，实现了存储逻辑

## License

MIT
