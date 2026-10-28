jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('firebase/auth', () => ({}));
jest.mock('firebase/database', () => ({}));
jest.mock('@react-native-community/geolocation', () => ({}));
jest.mock('@react-native-vector-icons/ionicons/static', () => ({
  Ionicons: 'Ionicons',
}));
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
jest.mock('../src/services/firebase', () => ({
  auth: null,
  configured: false,
}));
jest.mock('../src/services/chat', () => ({ startPresence: jest.fn() }));
import App from '../App';
test('shows login and Firebase setup hint without a configured project', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  expect(JSON.stringify(tree!.toJSON())).toContain('Chưa cấu hình Firebase');
  await ReactTestRenderer.act(async () => {
    tree!.unmount();
  });
});
