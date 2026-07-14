// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const originalConsoleError = console.error;

beforeAll(() => {
	console.error = (...args) => {
		const firstArg = args[0];

		if (typeof firstArg === 'string' && firstArg.includes('not wrapped in act(...)')) {
			return;
		}

		originalConsoleError(...args);
	};
});

afterAll(() => {
	console.error = originalConsoleError;
});

// Reduce async transition effects from MUI components in tests.
if (typeof document !== 'undefined') {
	const style = document.createElement('style');
	style.innerHTML = `
		*, *::before, *::after {
			transition: none !important;
			animation: none !important;
			caret-color: transparent !important;
		}
	`;
	document.head.appendChild(style);
}