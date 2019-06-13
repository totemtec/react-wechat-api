import React from 'react';

const { userAgent } = window.navigator;

// 增加开发环境下的调试支持
var checkAgent = /micromessenger/i.test(userAgent);

if (process.env.NODE_ENV === 'development')
{
	checkAgent = true;
}

export const isWechat = checkAgent

export function debounce(fn, delay) {
	let t0;
	let timeoutId;
	const finalFn = (...args) => {
		const t1 = Date.now();
		if (t0 && t1 - t0 >= delay) {
			t0 = 0;
			fn(...args);
		}
		else {
			t0 = t1;
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => finalFn(...args), delay);
		}
	};
	return finalFn;
}

export const Component = React.PureComponent || React.Component;
