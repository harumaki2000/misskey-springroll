/*
 * SPDX-FileCopyrightText: yume/yumechi-no-kun
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type SystemdState =
| { state: 'running' }
| { state: 'done' }
| { state: 'failed'; message: string };

export class Systemd {
	private readonly ttyDom: HTMLDivElement;

	constructor(version: string, cmdline: string) {
		const tty = document.querySelector<HTMLDivElement>('#tty');
		if (tty == null) {
			throw new Error('#tty element was not found');
		}
		this.ttyDom = tty;

		const welcome = document.createElement('div');
		welcome.className = 'tty-line';
		welcome.innerText = `misskey-springroll ${version} running in Web mode. cmdline: ${cmdline}`;
		this.ttyDom.appendChild(welcome);
	}

	public async start<T>(id: string, promise: Promise<T>): Promise<T> {
		let state: SystemdState = { state: 'running' };
		let persistentDom: HTMLDivElement | null = null;
		const started = Date.now();

		const formatRunning = () => {
			const shiftArray = <U>(arr: U[], n: number): U[] => {
				return arr.slice(n).concat(arr.slice(0, n));
			};

			const elapsedSecs = Math.floor((Date.now() - started) / 1000);
			const stars = shiftArray([' ', '*', '*', '*', ' ', ' '], elapsedSecs % 6);

			const spanStatus = document.createElement('span');
			spanStatus.innerText = stars.join('');
			spanStatus.className = 'tty-status-running';

			const spanMessage = document.createElement('span');
			spanMessage.innerText = `A start job is running for ${id} (${elapsedSecs}s / no limit)`;

			const div = document.createElement('div');
			div.className = 'tty-line';
			div.innerHTML = '[';
			div.appendChild(spanStatus);
			div.innerHTML += '] ';
			div.appendChild(spanMessage);

			return div;
		};

		const formatDone = () => {
			const elapsedSecs = (Date.now() - started) / 1000;

			const spanStatus = document.createElement('span');
			spanStatus.innerText = '  OK  ';
			spanStatus.className = 'tty-status-ok';

			const spanMessage = document.createElement('span');
			spanMessage.innerText = `Finished ${id} in ${elapsedSecs.toFixed(3)}s`;

			const div = document.createElement('div');
			div.className = 'tty-line';
			div.innerHTML = '[';
			div.appendChild(spanStatus);
			div.innerHTML += '] ';
			div.appendChild(spanMessage);

			return div;
		};

		const formatFailed = (message: string) => {
			const elapsedSecs = (Date.now() - started) / 1000;

			const spanStatus = document.createElement('span');
			spanStatus.innerText = 'FAILED';
			spanStatus.className = 'tty-status-failed';

			const spanMessage = document.createElement('span');
			spanMessage.innerText = `Failed ${id} in ${elapsedSecs.toFixed(3)}s: ${message}`;

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
						this.ttyDom.appendChild(persistentDom);
					} else {
						persistentDom.innerHTML = formatRunning().innerHTML;
					}
					break;
				case 'done':
					if (persistentDom === null) {
						persistentDom = formatDone();
						this.ttyDom.appendChild(persistentDom);
					} else {
						persistentDom.innerHTML = formatDone().innerHTML;
					}
					break;
				case 'failed':
					if (persistentDom === null) {
						persistentDom = formatFailed(state.message);
						this.ttyDom.appendChild(persistentDom);
					} else {
						persistentDom.innerHTML = formatFailed(state.message).innerHTML;
					}
					break;
			}
		};

		render();
		const interval = setInterval(render, 500);

		try {
			const res = await promise;
			state = { state: 'done' };
			return res;
		} catch (error: unknown) {
			if (error instanceof Error) {
				state = { state: 'failed', message: error.message };
			} else {
				state = { state: 'failed', message: 'Unknown error' };
			}
			throw error;
		} finally {
			clearInterval(interval);
			render();
		}
	}

	public async startSync<T>(id: string, func: () => T): Promise<T> {
		return this.start(id, (async () => func())());
	}

	public skip(id: string, message?: string): void {
		const spanStatus = document.createElement('span');
		spanStatus.innerText = ' SKIP ';
		spanStatus.className = 'tty-status-skip';

		const spanMessage = document.createElement('span');
		spanMessage.innerText = `Skipped ${id}${message ? `: ${message}` : ''}`;

		const div = document.createElement('div');
		div.className = 'tty-line';
		div.innerHTML = '[';
		div.appendChild(spanStatus);
		div.innerHTML += '] ';
		div.appendChild(spanMessage);

		this.ttyDom.appendChild(div);
	}

	public emergency_mode(code: string, details: unknown): void {
		const divPrev = document.createElement('div');
		divPrev.className = 'tty-line';
		const detailMessage =
typeof details === 'object' && details !== null && 'message' in details
	? (details as { message: unknown }).message
	: details;
		divPrev.innerText = `Critical error occurred [${code}] : ${String(detailMessage)}`;
		this.ttyDom.appendChild(divPrev);

		const div = document.createElement('div');
		div.className = 'tty-line';
		div.innerText = 'You are in emergency mode. Type Ctrl-Shift-I to view logs. Clearing local storage by going to /flush and browser settings may help.';
		this.ttyDom.appendChild(div);
	}
}
