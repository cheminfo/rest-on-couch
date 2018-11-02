import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import store from './store';
import App from './components/App';
import { getRocStatus } from './actions/main';

store.dispatch(getRocStatus());

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
