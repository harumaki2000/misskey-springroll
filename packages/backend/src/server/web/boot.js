/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

'use strict';

class Systemd {
	constructor(version, cmdline) {
		this.tty_dom = document.querySelector('#tty');
		const welcome = document.createElement('div');
		welcome.className = 'tty-line';
		welcome.innerText = `misskey-springroll ${version} running in Web mode. cmdline: ${cmdline}`;
		this.tty_dom.appendChild(welcome);
	}
	async start(id, promise) {
		let state = { state: 'running' };
		let persistentDom = null;
		const started = Date.now();
		const formatRunning = () => {
			const shiftArray = (arr, n) => {
				return arr.slice(n).concat(arr.slice(0, n));
			};
			const elapsed_secs = Math.floor((Date.now() - started) / 1000);
			const stars = shiftArray([' ', '*', '*', '*', ' ', ' '], elapsed_secs % 6);
			const spanStatus = document.createElement('span');
			spanStatus.innerText = stars.join('');
			spanStatus.className = 'tty-status-running';
			const spanMessage = document.createElement('span');
			spanMessage.innerText = `A start job is running for ${id} (${elapsed_secs}s / no limit)`;
			const div = document.createElement('div');
			div.className = 'tty-line';
			div.innerHTML = '[';
			div.appendChild(spanStatus);
			div.innerHTML += '] ';
			div.appendChild(spanMessage);
			return div;
		};
		const formatDone = () => {
			const elapsed_secs = (Date.now() - started) / 1000;
			const spanStatus = document.createElement('span');
			spanStatus.innerText = '  OK  ';
			spanStatus.className = 'tty-status-ok';
			const spanMessage = document.createElement('span');
			spanMessage.innerText = `Finished ${id} in ${elapsed_secs.toFixed(3)}s`;
			const div = document.createElement('div');
			div.className = 'tty-line';
			div.innerHTML = '[';
			div.appendChild(spanStatus);
			div.innerHTML += '] ';
			div.appendChild(spanMessage);
			return div;
		};
		const formatFailed = (message) => {
			const elapsed_secs = (Date.now() - started) / 1000;
			const spanStatus = document.createElement('span');
			spanStatus.innerText = 'FAILED';
			spanStatus.className = 'tty-status-failed';
			const spanMessage = document.createElement('span');
			spanMessage.innerText = `Failed ${id} in ${elapsed_secs.toFixed(3)}s: ${message}`;
			const div = document.createElement('div');
			div.className = 'tty-line';
			div.innerHTML = '[';
			div.appendChild(spanStatus);
			div.innerHTML += '] ';
			div.appendChild(spanMessage);
			return div;
		};
		const render = () => {
			switch (state.state) {
				case 'running':
					if (persistentDom === null) {
						persistentDom = formatRunning();
						this.tty_dom.appendChild(persistentDom);
					} else {
						persistentDom.innerHTML = formatRunning().innerHTML;
					}
					break;
				case 'done':
					if (persistentDom === null) {
						persistentDom = formatDone();
						this.tty_dom.appendChild(persistentDom);
					} else {
						persistentDom.innerHTML = formatDone().innerHTML;
					}
					break;
				case 'failed':
					if (persistentDom === null) {
						persistentDom = formatFailed(state.message);
						this.tty_dom.appendChild(persistentDom);
					} else {
						persistentDom.innerHTML = formatFailed(state.message).innerHTML;
					}
					break;
			}
		};
		render();
		const interval = setInterval(render, 500);
		try {
			let res = await promise;
			state = { state: 'done' };
			return res;
		} catch (e) {
			if (e instanceof Error) {
				state = { state: 'failed', message: e.message };
			} else {
				state = { state: 'failed', message: 'Unknown error' };
			}
			throw e;
		} finally {
			clearInterval(interval);
			render();
		}
	}
	async startSync(id, func) {
		return this.start(id, (async () => {
			return func();
		})());
	}
	emergency_mode(code, details) {
		``;
		const divPrev = document.createElement('div');
		divPrev.className = 'tty-line';
		// Operator precedence fixed here
		divPrev.innerText = 'Critical error occurred [' + code + '] : ' + (details.message ? details.message : details);
		this.tty_dom.appendChild(divPrev);
		const div = document.createElement('div');
		div.className = 'tty-line';
		div.innerText = 'You are in emergency mode. Type Ctrl-Shift-I to view system logs. Clearing local storage by going to /flush and browser settings may help.';
		this.tty_dom.appendChild(div);
	}
}

// ブロックの中に入れないと、定義した変数がブラウザのグローバルスコープに登録されてしまい邪魔なので
(async () => {
	// Hoisted renderError and addStyle so they are always available
	async function addStyle(styleText) {
		await systemd.startSync('Apply custom Style', () => {
			let css = document.createElement('style');
			css.appendChild(document.createTextNode(styleText));
			document.head.appendChild(css);
		});
	}

	async function renderError(code, details) {
		// systemd may not be initialized yet, so call it if it exists
		if (typeof systemd !== 'undefined') {
			systemd.emergency_mode(code, details);
		}
		// Cannot set property 'innerHTML' of null を回避
		if (document.readyState === 'loading') {
			await new Promise(resolve => window.addEventListener('DOMContentLoaded', resolve));
		}

		const locale = JSON.parse(localStorage.getItem('locale') || '{}');

		const messages = Object.assign({
			title: 'Failed to initialize Misskey',
			solution: 'The following actions may solve the problem.',
			solution1: 'Update your os and browser',
			solution2: 'Disable an adblocker',
			solution3: 'Clear the browser cache',
			solution4: '(Tor Browser) Set dom.webaudio.enabled to true',
			otherOption: 'Other options',
			otherOption1: 'Clear preferences and cache',
			otherOption2: 'Start the simple client',
			otherOption3: 'Start the repair tool',
			otherOption4: 'Start Misskey in safe mode',
		}, locale?._bootErrors || {});
		const reload = locale?.reload || 'Reload';

		const safeModeUrl = new URL(window.location.href);
		safeModeUrl.searchParams.set('safemode', 'true');

		let errorsElement = document.getElementById('errors');

		if (!errorsElement) {
			document.body.innerHTML = `
      <svg class="icon-warning" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <path d="M12 9v2m0 4v.01"></path>
        <path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75"></path>
      </svg>
      <h1>${messages.title}</h1>
      <button class="button-big" onclick="location.reload(true);">
        <span class="button-label-big">${reload}</span>
      </button>
      <p><b>${messages.solution}</b></p>
      <p>${messages.solution1}</p>
      <p>${messages.solution2}</p>
      <p>${messages.solution3}</p>
      <p>${messages.solution4}</p>
      <details style="color: #86b300;">
        <summary>${messages.otherOption}</summary>
        <a href="${safeModeUrl}">
          <button class="button-small">
            <span class="button-label-small">${messages.otherOption4}</span>
          </button>
        </a>
        <br>
        <a href="/flush">
          <button class="button-small">
            <span class="button-label-small">${messages.otherOption1}</span>
          </button>
        </a>
        <br>
        <a href="/cli">
          <button class="button-small">
            <span class="button-label-small">${messages.otherOption2}</span>
          </button>
        </a>
        <br>
        <a href="/bios">
          <button class="button-small">
            <span class="button-label-small">${messages.otherOption3}</span>
          </button>
        </a>
      </details>
      <br>
      <div id="errors"></div>
      `;
			errorsElement = document.getElementById('errors');
		}
		const detailsElement = document.createElement('details');
		detailsElement.id = 'errorInfo';
		detailsElement.innerHTML = `
    <br>
    <summary>
      <code>ERROR CODE: ${code}</code>
    </summary>
    <code>${details.toString()} ${JSON.stringify(details)}</code>`;
		errorsElement.appendChild(detailsElement);
		// Dynamically add styles for the error page
		const style = document.createElement('style');
		style.innerHTML = `
    * {
      font-family: BIZ UDGothic, Roboto, HelveticaNeue, Arial, sans-serif;
    }

    #misskey_app,
    #splash {
      display: none !important;
    }

    body,
    html {
      background-color: #222;
      color: #dfddcc;
      justify-content: center;
      margin: auto;
      padding: 10px;
      text-align: center;
    }

    button {
      border-radius: 999px;
      padding: 0px 12px 0px 12px;
      border: none;
      cursor: pointer;
      margin-bottom: 12px;
    }

    .button-big {
      background: linear-gradient(90deg, rgb(134, 179, 0), rgb(74, 179, 0));
      line-height: 50px;
    }

    .button-big:hover {
      background: rgb(153, 204, 0);
    }

    .button-small {
      background: #444;
      line-height: 40px;
    }

    .button-small:hover {
      background: #555;
    }

    .button-label-big {
      color: #222;
      font-weight: bold;
      font-size: 1.2em;
      padding: 12px;
    }

    .button-label-small {
      color: rgb(153, 204, 0);
      font-size: 16px;
      padding: 12px;
    }

    a {
      color: rgb(134, 179, 0);
      text-decoration: none;
    }

    p,
    li {
      font-size: 16px;
    }

    .icon-warning {
      color: #dec340;
      height: 4rem;
      padding-top: 2rem;
    }

    h1 {
      font-size: 1.5em;
      margin: 1em;
    }

    code {
      font-family: Fira, FiraCode, monospace;
    }

    #errorInfo {
      background: #333;
      margin-bottom: 2rem;
      padding: 0.5rem 1rem;
      width: 40rem;
      border-radius: 10px;
      justify-content: center;
      margin: auto;
    }

    #errorInfo summary {
      cursor: pointer;
    }

    #errorInfo summary > * {
      display: inline;
    }

    @media screen and (max-width: 500px) {
      #errorInfo {
        width: 50%;
      }
    }`;
		document.head.appendChild(style);
	}

	window.onerror = (e) => {
		console.error(e);
		renderError('SOMETHING_HAPPENED', e);
	};
	window.onunhandledrejection = (e) => {
		console.error(e);
		renderError('SOMETHING_HAPPENED_IN_PROMISE', e);
	};

	const cmdline = new URLSearchParams(location.search).get('cmdline') || '';
	const cmdlineArray = cmdline.split(',').map(x => x.trim());
	if (cmdlineArray.includes('nosplash')) {
		document.querySelector('#splashIcon').classList.add('hidden');
		document.querySelector('#splashSpinner').classList.add('hidden');
	}

	const systemd = new Systemd(VERSION, cmdline);

	if (cmdlineArray.includes('leak')) {
		await systemd.start('Promise Leak Service', new Promise(() => { }));
	}

	let forceError = localStorage.getItem('forceError');
	if (forceError != null) {
		await systemd.startSync('Force Error Service', () => {
			throw new Error('This error is forced by having forceError in local storage.');
		});
	}

	//#region Detect language & fetch translations
	if (!localStorage.hasOwnProperty('locale')) {
		const supportedLangs = LANGS;
		let lang = localStorage.getItem('lang');
		if (lang == null || !supportedLangs.includes(lang)) {
			if (supportedLangs.includes(navigator.language)) {
				lang = navigator.language;
			} else {
				lang = supportedLangs.find(x => x.split('-')[0] === navigator.language);

				// Fallback
				if (lang == null) lang = 'en-US';
			}
		}

		const metaRes = await systemd.start('Fetch /api/meta', window.fetch('/api/meta', {
			method: 'POST',
			body: JSON.stringify({}),
			credentials: 'omit',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json',
			},
		}));
		if (metaRes.status !== 200) {
			renderError('META_FETCH');
			return;
		}
		const meta = await systemd.start('Parse /api/meta', metaRes.json());
		const v = meta.version;
		if (v == null) {
			renderError('META_FETCH_V');
			return;
		}

		// for https://github.com/misskey-dev/misskey/issues/10202
		if (lang == null || lang.toString == null || lang.toString() === 'null') {
			console.error('invalid lang value detected!!!', typeof lang, lang);
			lang = 'en-US';
		}

		const localRes = await systemd.start('Fetch Locale files', window.fetch(`/assets/locales/${lang}.${v}.json`));
		if (localRes.status === 200) {
			localStorage.setItem('lang', lang);
			localStorage.setItem('locale', await localRes.text());
			localStorage.setItem('localeVersion', v);
		} else {
			renderError('LOCALE_FETCH');
			return;
		}
	}
	// FIX 1: Removed the stray comma that was here
	//#endregion

	//#region Script
	async function importAppScript() {
		await systemd.start('Load App Script', import(`/vite/${CLIENT_ENTRY}`))
			.catch(async e => {
				console.error(e);
				renderError('APP_IMPORT', e);
			}); // FIX 2: Added missing closing });
	}

	// タイミングによっては、この時点でDOMの構築が済んでいる場合とそうでない場合とがある
	if (document.readyState !== 'loading') {
		systemd.start('import App Script', importAppScript());
	} else {
		window.addEventListener('DOMContentLoaded', () => {
			systemd.start('import App Script', importAppScript());
		});
	}
	//#endregion

	let isSafeMode = (localStorage.getItem('isSafeMode') === 'true');

	if (!isSafeMode) {
		const urlParams = new URLSearchParams(window.location.search);

		if (urlParams.has('safemode') && urlParams.get('safemode') === 'true') {
			localStorage.setItem('isSafeMode', 'true');
			isSafeMode = true;
		}
	}

	//#region Theme
	if (!isSafeMode) {
		const theme = localStorage.getItem('theme');
		if (theme) {
			await systemd.startSync('Apply theme', () => {
				for (const [k, v] of Object.entries(JSON.parse(theme))) {
					document.documentElement.style.setProperty(`--MI_THEME-${k}`, v.toString());

					// HTMLの theme-color 適用
					if (k === 'htmlThemeColor') {
						for (const tag of document.head.children) {
							if (tag.tagName === 'META' && tag.getAttribute('name') === 'theme-color') {
								tag.setAttribute('content', v);
								break;
							}
						}
					}
				} // FIX 3: Removed extra '}' that was here. The 'for' loop's '}' is above.
			});
		}
	}
	const colorScheme = localStorage.getItem('colorScheme');
	if (colorScheme) {
		document.documentElement.style.setProperty('color-scheme', colorScheme);
	}
	//#endregion

	const fontSize = localStorage.getItem('fontSize');
	if (fontSize) {
		document.documentElement.classList.add('f-' + fontSize);
	}

	const useSystemFont = localStorage.getItem('useSystemFont');
	if (useSystemFont) {
		document.documentElement.classList.add('useSystemFont');
	}

	if (!isSafeMode) {
		const customCss = localStorage.getItem('customCss');
		if (customCss && customCss.length > 0) {
			await systemd.startSync('Apply custom CSS', () => {
				const style = document.createElement('style');
				style.innerHTML = customCss;
				document.head.appendChild(style);
			});
		}
	} // FIX 4: Closed the `if (!isSafeMode)` block that was left open.
})(); // This is the end of the main IIFE
