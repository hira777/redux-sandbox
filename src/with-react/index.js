import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import todoApp from './reducers';
import App from './components/App';

const store = createStore(todoApp);

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
