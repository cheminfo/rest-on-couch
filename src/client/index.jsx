import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import select2 from 'select2';

import App from './components/App';
import store from './store';

select2(window);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root'),
);
