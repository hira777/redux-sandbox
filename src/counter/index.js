import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import Counter from './components/Counter';
import counter from './reducers';

// Storeを生成する、第1引数にReducerを渡す
// 今回、Reducerとしてcounterを渡しているため
// Actionをdispatchする度に、counterが実行され、Actionに応じたstateを返す
const store = createStore(counter);
const rootEl = document.getElementById('root');

const render = () => ReactDOM.render(
  <Counter
    value={store.getState()}
    onIncrement={() => store.dispatch({ type: 'INCREMENT' })}
    onDecrement={() => store.dispatch({ type: 'DECREMENT' })}
  />,
  rootEl
);

render();

// change listener（Actionがdispatchされる度に呼ばれる関数）を追加する
// そのため、stateの更新がある度に呼ばれる
store.subscribe(render);