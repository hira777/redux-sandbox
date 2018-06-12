import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import todoApp from './reducers';
import { logger, crashReporter } from './middlewares';
import App from './components/App';

const store = createStore(todoApp, applyMiddleware(logger, crashReporter));

render(
  // `<Provider>`というコンポーネントを利用すれば
  // アプリケーション内の全てのcontainer componentsが
  // storeを明示的に渡すことなく利用できる
  // （container components毎にstoreを渡す記述をする必要がなくなる）
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
