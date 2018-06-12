# Middleware

Redux Middleware は、Express または Koa Middleware と同じような概念的のもの。

これは Action の dispatch が Reducer に到達するまでの間にサードパーティの拡張ポイントを提供する（dispatch から Reducer の間に独自の処理を追加できる）。

ログやクラッシュ報告、非同期 API の呼び出し、ルーティングなどのために Redux Middleware は仕様されている。

## Understanding Middleware

Middleware は、非同期 API 呼び出しを含むさまざまな目的で使用できる。

例として、ロギングとクラッシュレポートを実装したい状況で、Middleware の利用にいたるプロセスを見ていく。

### Problem: Logging

Redux の利点の 1 つは、state の変化を予測可能かつ透過的にすることである。Action が dispatch される度
 に、新しい state が計算され、保存される。state は自分自身では変更でない。特定の Action が dispatch された結果としてのみ変更できる。

そのため、アプリで起こるすべての Action を、その後に計算される state と共に記録すれば、何か問題が発生した時に、ログを振り返ってどの Action が state を破損させているかなどを把握できる。

これを Redux ではどのようにアプローチしていくか見ていく。

#### Attempt #1: Logging Manuall

最も単純な解決策は、`store.dispatch(action)`を呼び出すたびに、Action と次の state を自分で記録することである。

ToDo を作成する際に以下を呼び出す。

```js
store.dispatch(addTodo('Use Redux'));
```

Action と state を記録するには、以下のように変更する。

```js
const action = addTodo('Use Redux')
​
console.log('dispatching', action)
store.dispatch(action)
console.log('next state', store.getState())
```

上記で目的を果たせるが、ベストな解決策ではない。

#### Attempt #2: Wrapping Dispatch

以下の関数でロギングを抽出できる。

```js
function dispatchAndLog(store, action) {
  console.log('dispatching', action);
  store.dispatch(action);
  console.log('next state', store.getState());
}
```

`store.dispatch()`の代わりにどこでも利用できる。

```js
dispatchAndLog(store, addTodo('Use Redux'));
```

上記の場合、毎回特別な関数をインポートするため、便利ではない。

#### Attempt #3: Monkeypatching Dispatch

Redux Store はいくつかのメソッドを持つ単なるオブジェクトである。そのため、`dispatch` をモンキーパッチできる。

※モンキーパッチとはオリジナルのソースコードを変更することなく、実行時にコードを拡張したり、変更したりする手段のこと。

```js
const next = store.dispatch;

store.dispatch = function dispatchAndLog(action) {
  console.log('dispatching', action);
  let result = next(action);
  console.log('next state', store.getState());
  return result;
};
```

これで Action をどこで dispatch するに関わらず、ログに記録されることが保証された。

モンキーパッチもベストな手段ではないが、今のところこれで目的は達成できている。

#### Problem: Crash Reporting

プロダクトの JavaScript エラーを報告するモンキーパッチを考えてみる。

グローバルな `window.onerror` イベントは、一部の古いブラウザではスタック情報を提供しないため、エラーが発生した理由を理解する上で重要。

Action を dispatch してエラーが throw された場合、[Sentry](https://sentry.io/welcome/) （クラッシュレポートサービス）のように、エラーの原因となった Action、および現在の state を送信する。こうすることで、開発時にエラーを再現するのがかなり簡単になる。

ユーティリティのエコシステムを保つため、ロギングとクラッシュレポートを別々のモジュールとして定義する。

```js
function patchStoreToAddLogging(store) {
  const next = store.dispatch

  store.dispatch = function dispatchAndLog(action) {
    console.log('dispatching', action)
    let result = next(action)
    console.log('next state', store.getState())
    return result
  }
}
​
function patchStoreToAddCrashReporting(store) {
  const next = store.dispatch

  store.dispatch = function dispatchAndReportErrors(action) {
    try {
      return next(action)
    } catch (err) {
      console.error('Caught an exception!', err)
      Raven.captureException(err, {
        extra: {
          action,
          state: store.getState()
        }
      })
      throw err
    }
  }
}
```

これらの関数が別々のモジュールとして公開されている場合は、以下のように Store にモンキーパッチを当てれる。

```js
function counter(state, action) {
  if (typeof state === 'undefined') {
    return 0;
  }

  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
}
const store = Redux.createStore(counter);

patchStoreToAddLogging(store);
patchStoreToAddCrashReporting(store);

store.dispatch({ type: 'INCREMENT' });
// => dispatching {type: "INCREMENT"}
// => next state 1

store.dispatch();
// => Uncaught ReferenceError: Raven is not defined at Object.dispatchAndReportErrors [as dispatch]
```

しかし、これもまだベストな手段ではない。

#### Attempt #4: Hiding Monkeypatching

上記では`store.dispatch`を置き換えていたが、新しい`dispatch`関数を返すように変更してみる。

```js
// モンキーパッチを当てた新しい`dispatch`関数を返す
function applyMiddlewareByMonkeypatching(store, middlewares) {
  middlewares = middlewares.slice()
  middlewares.reverse()
​
  // ミドルウェアごとにdispatch関数を拡張させる
  middlewares.forEach(middleware =>
    store.dispatch = middleware(store)
  )
}
```

このように複数のミドルウェアを適用するために使用することができます：

```js
function counter(state, action) {
  if (typeof state === 'undefined') {
    return 0;
  }

  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
}
const store = Redux.createStore(counter);

function logger(store) {
  const next = store.dispatch
​
  return function dispatchAndLog(action) {
    console.log('dispatching', action)
    let result = next(action)
    console.log('next state', store.getState())
    return result
  }
}

applyMiddlewareByMonkeypatching(store, [logger]);
```

私たちライブラリの中に隠しているという事実は、この事実を変えません。

#### Attempt #5: Removing Monkeypatching

なぜ`dispatch`を上書きするのか（モンキーパッチを当てるのか）?

後で呼び出せるようにするためであるが、すべてのミドルウェアが以前ラップされた `store.dispatch`にアクセス、呼び出しできるようにするためでもある。

```js
function logger(store) {
  // 以前ラップされた`store.dispatch`を参照している
  const next = store.dispatch
​
  return function dispatchAndLog(action) {
    console.log('dispatching', action)
    let result = next(action)
    console.log('next state', store.getState())
    return result
  }
}
```

以下のように`logger`、`report`、`error`というミドルウェアで、`dispatch`を順番に拡張した場合。

```js
function logger(store) {
  // 以前ラップされた`store.dispatch`を参照している
  const next = store.dispatch

  return function dispatchAndLog(action) {
    console.log('dispatching', action)
    let result = next(action)
    console.log('next state', store.getState())
    return result
  }
}

function report(store) {
  const next = store.dispatch

  return function dispatchAndLog(action) {
    console.log('dispatching', action)
    let result = next(action)
    console.log('next state', store.getState())
    return result
  }
}

function error(store) {
  const next = store.dispatch

  return function dispatchAndLog(action) {
    console.log('dispatching', action)
    let result = next(action)
    console.log('next state', store.getState())
    return result
  }
}

function applyMiddlewareByMonkeypatching(store, middlewares) {
  middlewares = middlewares.slice()
  middlewares.reverse()
​
  middlewares.forEach(middleware =>
    store.dispatch = middleware(store)
  )
}

applyMiddlewareByMonkeypatching(store, [logger, report, error]);
```

- `logger`は元の`store.dispatch`を参照してる
- `report`は`logger`で拡張された`store.dispatch`を参照してる
- `error`は`report`で拡張された`store.dispatch`を参照してる

という状態になる。このようにミドルウェアをチェインすることはとても重要。

チェーニングを可能にする別の方法もある。ミドルウェアは`store`インスタンスからパラメータを読み込むのではなく、`next`（`store.dispatch`）をパラメータとして受け取ることもできる。

```js
function logger(store) {
  return function wrapDispatchToAddLogging(next) {
    return function dispatchAndLog(action) {
      console.log('dispatching', action);
      let result = next(action);
      console.log('next state', store.getState());
      return result;
    };
  };
}
```

上記は、アロー関数を利用すれば以下のように簡潔に書ける。

```js
const logger = store => next => action => {
  console.log('dispatching', action)
  let result = next(action)
  console.log('next state', store.getState())
  return result
}
​
const crashReporter = store => next => action => {
  try {
    return next(action)
  } catch (err) {
    console.error('Caught an exception!', err)
    Raven.captureException(err, {
      extra: {
        action,
        state: store.getState()
      }
    })
    throw err
  }
}
```

**これはまさに Redux ミドルウェアのようなものです**

現在、ミドルウェアは `next()`（`dispatch`関数）を受け取り新たな`dispatch`関数を返す。`dispatch`関数は、ミドルウェアに対して`next()`として機能する。

`getState()`のようないくつかの Store メソッドにアクセスすることもできるため、`store`は最上位の引数として利用できる。

#### Attempt #6: Naïvely Applying the Middleware

`applyMiddlewareByMonkeypatching()`の代わりに、完全にラップされた最後の `dispatch()`関数を最初に取得し、それを使ってストアのコピーを返す `applyMiddleware()`を書くことができます：

```js
function applyMiddleware(store, middlewares) {
  let dispatch = store.dispatch;

  middlewares = middlewares.slice();
  middlewares.reverse();

  middlewares.forEach(middleware => (dispatch = middleware(store)(dispatch)));

  return Object.assign({}, store, { dispatch });
}
```

Redux の`applyMiddleware()`の実装と似ていますが、3 つの重要な点がなる。

- `Store API`のサブセットを Middleware（`dispatch(action)`）か `getState()`にのみ公開する。

- `next(action)`ではなく`store.dispatch(action)`を Middleware から呼び出すと、Action は現在の Middleware を含めて Middleware Chain 全体を再び移動することを確認する。これは非同期 Middleware に便利だが、後述するセットアップ中に`dispatch`を呼び出す際には注意が必要。

- Middleware を一度しか適用できないようにするために、`store`自体ではなく`createStore()`で動作する。構文は`(store, middleware)）=> store`の代わりに、`(...middlewares) => (createStore) => createStore`となる。

`createStore()`を利用する前に `createStore()`に関数を適用するのは面倒なため、`createStore()`はそのような関数を指定するためのオプションの最後の引数を受け取ります。

#### Caveat: Dispatching During Setup

`applyMiddleware`がミドルウェアを実行して設定する間、`store.dispatch`関数は `createStore`によって提供されるバニラバージョンを指します。 dispatch すると、他のミドルウェアが適用されなくなります。 セットアップ中に別のミドルウェアとのやりとりが予想される場合は、おそらく失望します。 この予期しない動作のため、セットアップが完了する前に Action を dispatch しようとすると、 `applyMiddleware`はエラーをスローします。 代わりに、共通オブジェクト（API 呼び出しミドルウェアの場合は API クライアントオブジェクト）を介して他のミドルウェアと直接通信するか、コールバックを使用してミドルウェアを構築するまで待機する必要があります。

#### The Final Approach

以下は前述で作成した以下の Middleware。

```js
const logger = store => next => action => {
  console.log('dispatching', action)
  let result = next(action)
  console.log('next state', store.getState())
  return result
}
​
const crashReporter = store => next => action => {
  try {
    return next(action)
  } catch (err) {
    console.error('Caught an exception!', err)
    Raven.captureException(err, {
      extra: {
        action,
        state: store.getState()
      }
    })
    throw err
  }
}
```

これを Redux Store に適用する方法は以下の通り。

```js
import { createStore, combineReducers, applyMiddleware } from 'redux'
​
const todoApp = combineReducers(reducers)
const store = createStore(
  todoApp,
  // applyMiddleware()は、Middlewareの処理方法をcreateStore()に指示する
  applyMiddleware(logger, crashReporter)
)
```

これで Store インスタンスに dispatch された Action は、`logger`と`crashReporter`を流す。

```js
store.dispatch(addTodo('Use Redux'));
```
