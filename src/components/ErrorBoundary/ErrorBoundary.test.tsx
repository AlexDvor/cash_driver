import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { ErrorBoundary } from './ErrorBoundary';

function host(app: Renderer.ReactTestRenderer, testID: string) {
  return app.root.findAll(
    node => typeof node.type === 'string' && node.props.testID === testID,
  );
}

let shouldThrow = true;
function Bomb() {
  if (shouldThrow) {
    throw new Error('boom');
  }
  return <Text testID="child">ok</Text>;
}

beforeEach(() => {
  shouldThrow = true;
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

test('shows a fallback instead of crashing, and retry remounts the app', async () => {
  let app!: Renderer.ReactTestRenderer;
  await act(async () => {
    app = Renderer.create(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
  });
  expect(host(app, 'error-fallback')).toHaveLength(1);
  expect(host(app, 'child')).toHaveLength(0);

  shouldThrow = false;
  await act(async () => {
    app.root.findByProps({ testID: 'error-retry' }).props.onPress();
  });
  expect(host(app, 'error-fallback')).toHaveLength(0);
  expect(host(app, 'child')).toHaveLength(1);
});

test('renders children untouched when nothing fails', async () => {
  shouldThrow = false;
  let app!: Renderer.ReactTestRenderer;
  await act(async () => {
    app = Renderer.create(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
  });
  expect(host(app, 'child')).toHaveLength(1);
});
