import React, { Children, cloneElement } from 'react';
import PropTypes from 'prop-types';
import { shareApiList } from './constants';
import EventEmitter from 'emit-lite';
import WechatAPIContext from './WechatAPIContext';
import { isWechat, debounce, Component } from './utils';

export default class WechatAPIProvider extends Component {
	static propTypes = {
		wx: PropTypes.object.isRequired,
		children: PropTypes.node.isRequired,
		location: PropTypes.any.isRequired,
		getConfig: PropTypes.func.isRequired,
		jsApiList: PropTypes.array,
		shareData: PropTypes.object,
		debug: PropTypes.bool,
		onSetShareData: PropTypes.func,
		onSetJsApiList: PropTypes.func,
		onGetConfigError: PropTypes.func,
		undocumented_isWechat: PropTypes.bool,
	};

	static defaultProps = {
		jsApiList: [],
		shareData: {},
		debug: false,
		onGetConfigError: (err) =>
			console.error('[WechatAPI] Failed to get config', err),
		undocumented_isWechat: isWechat,
	};

	constructor(props) {
		super(props);

		this.wechatAPIContext = {
			config: this.config,
			updateShareData: this.updateShareData,
			emitter: new EventEmitter(),
		};
		this.shareApiList = [];
		this.init();
	}

	componentDidUpdate(prevProps) {
		const { location, jsApiList } = this.props;

		/* istanbul ignore next */
		if (prevProps.location !== location) {
			this.config(jsApiList, this.updateShareData);
		}
	}

	init() {
		const { jsApiList, shareData } = this.props;
		this.config(jsApiList, () => {
			this.updateShareData(shareData);
		});
	}

	config = debounce((jsApiList, callback) => {
		const {
			props: {
				debug,
				wx,
				getConfig,
				onSetJsApiList,
				onGetConfigError,
				undocumented_isWechat,
			},
			wechatAPIContext: { emitter },
		} = this;

		const done = (apiList) => {
			if (onSetJsApiList) onSetJsApiList(apiList, wx);
			if (typeof callback === 'function') callback();
			emitter.emit('ready', wx);
		};

		if (!undocumented_isWechat) {
			if (debug) {
				this._updateShareApiList(jsApiList);
				done(jsApiList);
			}
			return;
		}

		const maybeGetConfigPromise = getConfig({
			url: window.location.href.replace(/#.*/, ''),
		});

		//这里判断一下是否iOS
		// 如果是iOS，只做一次getConfig，第一次成功了就存到sessionStorage里面
		// 以后每次都从sessionStorage里面拿config直接做wx.config
		Promise.resolve(maybeGetConfigPromise)
			.then((config) => {
				const apiList = [...jsApiList];
				this._updateShareApiList(apiList);
				wx.config({
					debug,
					jsApiList: apiList,
					...config,
				});
				wx.ready(() => done(apiList));
				wx.error((err) => emitter.emit('error', err));
			})
			.catch(onGetConfigError);
	}, 200);

	_updateShareApiList = (apiList) => {
		this.shareApiList = apiList.filter((api) => ~shareApiList.indexOf(api));
	};

	updateShareData = debounce((shareData) => {
		const { wx, onSetShareData } = this.props;
		const data = { ...this.props.shareData, ...shareData };
		Object.keys(data).forEach((key) => {
			const val = data[key];
			if (typeof val === 'function') {
				data[key] = val();
				//这里我给每个分享链接加个自己的参数，放在query-string里面
			}
		});
		this.shareApiList.forEach((shareType) => wx[shareType](data));
		if (onSetShareData) onSetShareData(data, this.shareApiList, wx);
	}, 200);

	render() {
		const {
			children,
			jsApiList,
			shareData,
			debug,
			getConfig,
			wx,
			onSetJsApiList,
			onSetShareData,
			onGetConfigError,
			undocumented_isWechat,
			...other
		} = this.props;
		return (
			<WechatAPIContext.Provider value={this.wechatAPIContext}>
				{Children.only(cloneElement(children, other))}
			</WechatAPIContext.Provider>
		);
	}
}
