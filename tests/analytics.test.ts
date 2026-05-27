import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { trackEvent } from '../lib/analytics.ts';

describe('trackEvent', () => {
  const originalWindow = (global as any).window;
  const originalDocument = (global as any).document;
  const originalNavigator = (global as any).navigator;
  const originalSessionStorage = (global as any).sessionStorage;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Basic mock setup
    // For window, we might need to bypass getter if it exists
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          href: 'https://example.com/test',
          pathname: '/test',
        },
        screen: {
          width: 1920,
          height: 1080,
        },
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, 'document', {
      value: {
        referrer: 'https://google.com',
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'MockAgent/1.0',
        language: 'en-US',
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, 'sessionStorage', {
      value: {
        store: {} as Record<string, string>,
        getItem(key: string) {
          return this.store[key] || null;
        },
        setItem(key: string, value: string) {
          this.store[key] = value;
        },
      },
      writable: true,
      configurable: true,
    });

    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    Object.defineProperty(global, 'window', { value: originalWindow, writable: true, configurable: true });
    Object.defineProperty(global, 'document', { value: originalDocument, writable: true, configurable: true });
    Object.defineProperty(global, 'navigator', { value: originalNavigator, writable: true, configurable: true });
    Object.defineProperty(global, 'sessionStorage', { value: originalSessionStorage, writable: true, configurable: true });

    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns early if window is undefined', () => {
    Object.defineProperty(global, 'window', { value: undefined, writable: true, configurable: true });

    let logged = false;
    let errored = false;
    console.log = () => { logged = true; };
    console.error = () => { errored = true; };

    trackEvent('page_view', { path: '/test' });

    assert.strictEqual(logged, false);
    assert.strictEqual(errored, false);
  });

  it('tracks event and calls console.log in development', () => {
    process.env.NODE_ENV = 'development';

    const logCalls: any[] = [];
    console.log = (...args) => {
      logCalls.push(args);
    };

    trackEvent('article_view', { article_id: '123' });

    assert.strictEqual(logCalls.length, 1);
    assert.strictEqual(logCalls[0][0], '[Analytics Event] article_view:');

    const eventData = logCalls[0][1];
    assert.strictEqual(eventData.event, 'article_view');
    assert.strictEqual(eventData.url, 'https://example.com/test');
    assert.strictEqual(eventData.path, '/test');
    assert.strictEqual(eventData.referrer, 'https://google.com');
    assert.strictEqual(eventData.user_agent, 'MockAgent/1.0');
    assert.strictEqual(eventData.screen_resolution, '1920x1080');
    assert.strictEqual(eventData.language, 'en-US');
    assert.strictEqual(eventData.article_id, '123');
    assert.ok(eventData.timestamp);
    assert.ok(eventData.session_id);
    assert.ok(eventData.session_id.startsWith('session_'));
  });

  it('calls Vercel Analytics if available', () => {
    const vaCalls: any[] = [];
    const mockWindow = { ...((global as any).window) };
    mockWindow.va = (...args: any[]) => {
      vaCalls.push(args);
    };
    Object.defineProperty(global, 'window', { value: mockWindow, writable: true, configurable: true });

    trackEvent('search_performed', { search_query: 'test' });

    assert.strictEqual(vaCalls.length, 1);
    assert.strictEqual(vaCalls[0][0], 'event');

    const payload = vaCalls[0][1];
    assert.strictEqual(payload.name, 'search_performed');
    assert.strictEqual(payload.data.search_query, 'test');
    assert.strictEqual(payload.data.event, 'search_performed');
  });

  it('handles missing sessionStorage (private mode)', () => {
    process.env.NODE_ENV = 'development';

    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: () => { throw new Error('Access denied'); },
        setItem: () => { throw new Error('Access denied'); }
      },
      writable: true,
      configurable: true,
    });

    const logCalls: any[] = [];
    console.log = (...args) => {
      logCalls.push(args);
    };

    trackEvent('page_view');

    assert.strictEqual(logCalls.length, 1);
    const eventData = logCalls[0][1];
    assert.ok(eventData.session_id.startsWith('temp_'));
  });

  it('catches and logs errors', () => {
    // Force an error by making window.location throw when accessed
    const mockWindow = { ...((global as any).window) };
    Object.defineProperty(mockWindow, 'location', {
      get: () => { throw new Error('Simulated access error'); }
    });
    Object.defineProperty(global, 'window', { value: mockWindow, writable: true, configurable: true });

    const errorCalls: any[] = [];
    console.error = (...args) => {
      errorCalls.push(args);
    };

    trackEvent('page_view');

    assert.strictEqual(errorCalls.length, 1);
    assert.strictEqual(errorCalls[0][0], 'Error tracking analytics event:');
    assert.ok(errorCalls[0][1] instanceof Error);
    assert.strictEqual(errorCalls[0][1].message, 'Simulated access error');
  });
});
