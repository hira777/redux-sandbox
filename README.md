# redux-sandbox

## Reduxとは
state（状態）の管理を容易で安全にするために考案されたアーキテクチャ（設計思想）やライブラリのこと。

このアーキテクチャに沿ったアプリケーションは以下のような恩恵が得られる。

- ステートの管理が容易
- 異なる開発環境(client,server, native)で一貫した振る舞いを持つアプリケーションの開発が可能
- テストが容易
- ステートの変更を遡れるデバッガーなど便利なツールを使った開発が可能
- Reactとの相性が良い

などの恩恵が得られる。

### stateとは?
- ユーザーが入力した値（フォームに入力したユーザー名やパスワードなど）
- UIの状態（どのタブや画面がアクティブなのか、ローディング）

### なぜReduxを利用するのか
- 状態を管理し易くするため
- 状態を安全に管理するため

### Reduxの基本的な考え方
- 状態を変更するには、Actionをディスパッチする必要がある（変更をActionとして定義することを強制することによって、どこで変更が起こっているか、どのような変更の種類があるのかを明確に理解できる。）

以下がActionの記述例

```js
{ type: 'ADD_TODO', text: 'Go to swimming pool' }
{ type: 'TOGGLE_TODO', index: 1 }
{ type: 'SET_VISIBILITY_FILTER', filter: 'SHOW_ALL' }
```

- 状態とActionを結びつけるために、Reducerと呼ばれる関数を記述する


```js
// Action
{ type: 'ADD_TODO', text: 'Go to swimming pool' }
{ type: 'TOGGLE_TODO', index: 1 }
{ type: 'SET_VISIBILITY_FILTER', filter: 'SHOW_ALL' }


// Reducer
function todos(state = [], action) {
  switch (action.type) {
    case 'ADD_TODO':
      return state.concat([{ text: action.text, completed: false }]);

    case 'TOGGLE_TODO':
      return state.map(
        (todo, index) =>
          action.index === index
            ? { text: todo.text, completed: !todo.completed }
            : todo
      );

    default:
      return state;
  }
}

function visibilityFilter(state = 'SHOW_ALL', action) {
  if (action.type === 'SET_VISIBILITY_FILTER') {
    return action.filter;
  } else {
    return state;
  }
}

// ↑の2つのReducerに対応する状態キーを呼び出すことで、アプリケーションの完全な状態を管理する別のReducerを作成する
function todoApp(state = {}, action) {
  return {
    todos: todos(state.todos, action),
    visibilityFilter: visibilityFilter(state.visibilityFilter, action)
  }
}
```

### Reduxの三原則
- Single source of truth
- State in read-only
- Changes are made with pure functions

#### Single source of truth（信頼できる唯一の情報源）
アプリケーションの全てのstateを単一のstore（stateと管理とactionを持つオブジェクト）で保持する。

#### State in read-only（stateは読み取り専用にする）
stateを変更は必ずactionを経由して行う。それ以外の手段で変更をしてはいけない。

なぜactionを必ず経由するかと言うと、actionを経由すれば**どのactionでどのstateが変更されているかがわかりやすいため**。

stateの更新を自由にできるようにしてしまうと、意図しない箇所でstateが変更されてしまったり、バグの特定が困難になる。

actionはただのオブジェクトのため、デバッグやテストの目的でログを記録して確認することなどもできる。

#### Changes are made with pure functions
stateがactionによってどのように更新されるかは、Reducerで指定する。

Reducerは受け取ったstateとactionを元に、新たなstateを返す純粋関数（同じ引数を渡されたら必ず同じ結果を返す関数）である。

また、Reducerは純粋関数のため、呼び出される順番を制御したり、追加データを渡したり、ページネーションなどの一般的な処理で再利用可能なReducerを作成することもできる。

### Actions
Actionsは、アプリケーションからstoreにデータを送信する情報のペイロード。

それらはstoreの唯一の情報源。`store.dispatch()`でstoreに送信する。

以下は新しいToDo項目の追加をするActionsの例。

```js
const ADD_TODO = 'ADD_TODO'

{
  type: ADD_TODO,
  text: 'Build my first Redux app'
}
```

ActionsはプレーンなJavaScriptオブジェクトであり、実行されるActionsのタイプを示す`type`プロパティが必要。

`type`は通常、文字列定数として定義する必要がある（上記の場合`'ADD_TODO'`）。

ただの文字列定数のため、以下のように別のモジュールにそれらを移動することができる。

```js
import { ADD_TODO, REMOVE_TODO } from '../actionTypes'
```

アクションタイプの定数を別々のファイルに定義する必要はなく、まったく定義する必要もない。

小規模なプロジェクトの場合、以下のようにアクションタイプに文字列を指定したほうが楽。

```js
{
  type: 'ADD_TODO',
  text: 'Build my first Redux app'
}
```

大規模なプロジェクトの場合、定数を明示的に宣言することにはいくつかの利点がある。コードベースをきれいに保つためのより実用的なヒントについては、[Reducing Boilerplate](https://redux.js.org/recipes/reducing-boilerplate)をチェック。

`type`以外のオブジェクトの構造は特にルールはないが、[Flux Standard Action](https://github.com/redux-utilities/flux-standard-action)というアクションの構築方法に関する推奨事項があるためそれを確認するべき。

#### Action Creators
Action creatorsはActionsを作成する機能。

Reduxでは、Action Creatorsは単にActionsを返す。

```js
function addTodo(text) {
  return {
    type: ADD_TODO,
    text
  };
}
```

これにより、簡単にテストできる。

ディスパッチを開始するには、返ってきたActionsを`dispatch()`に渡す。

```js
dispatch(addTodo(text));
```

あるいは、自動的にディスパッチするbound action creatorの作成ができる。

```js
const boundAddTodo = text => dispatch(addTodo(text));
```

`dispatch()`は`store.dispatch()`としてストアから直接アクセスできるが、react-reduxの`connect()`などのヘルパーを使用してアクセスする可能性が高くなる（らしい）。`bindActionCreators()`を利用すると、多くのAction Creatorsを自動的に`dispatch()`にバインドできます。

Action Creatorsは非同期であり、副作用がある。

- [async actions](https://redux.js.org/advanced/async-actions)
- [advanced tutorial](https://redux.js.org/advanced)

#### Actionsのサンプルコード
```js
/*
 * action types
 */
export const ADD_TODO = 'ADD_TODO';
export const TOGGLE_TODO = 'TOGGLE_TODO';
export const SET_VISIBILITY_FILTER = 'SET_VISIBILITY_FILTER';

/*
 * action creators（Actionsを作成する機能）
 */
export function addTodo(text) {
  return { type: ADD_TODO, text };
}

export function toggleTodo(index) {
  return { type: TOGGLE_TODO, index };
}

export function setVisibilityFilter(text) {
  return { type: SET_VISIBILITY_FILTER, filter };
}
```

### Reducers
Reducersは、storeに送信されたActionsに応じてアプリケーションのstateをどのように更新するのかを指定する。

そのため、Actionsには何が起こったのだけ記述され、アプリケーションのstateがどのように更新されるのかは記述されない。

#### stateの設計
Reduxでは、全てのアプリケーションのstateが単一のオブジェクトとして単一のstoreに格納されている。

今回はTodoアプリで以下のstateをstoreに格納したいとする。

- 現在選択されているフィルタ（`visibilityFilter`）
- Todoリスト（`todos`）

```js
{
  visibilityFilter: 'SHOW_ALL',
  todos: [
    {
      text: 'Consider using Redux',
      completed: true,
    },
    {
      text: 'Keep all state in a single tree',
      completed: false
    }
  ]
}
```

#### Handling Actions
Reducerは受け取ったstateとactionを元に、新たなstateを返す純粋関数（同じ引数を渡されたら必ず同じ結果を返す関数）である。

Reducerは純粋関数のためReducer内で以下を決して実行してはいけない。

- 引数を変更する
- API呼び出しやルーティングの移行などの副作用を実行する
- 純粋関数ではない関数（`Date.now()`、`Math.random()`など）を呼び出す

```js
import { VisibilityFilters } from './actions'

const initialState = {
  visibilityFilter: VisibilityFilters.SHOW_ALL,
  todos: []
};

function todoApp(state, action) {
  if (typeof state === 'undefined') {
    return initialState;
  }

  return state;
}
```

上記はES6のデフォルト引数を利用すれば、以下のようにコード量を減らせる。


```js
import { VisibilityFilters } from './actions'

const initialState = {
  visibilityFilter: VisibilityFilters.SHOW_ALL,
  todos: []
};

function todoApp(state = initialState, action) {
  return state;
}
```

上記にアクションタイプ`SET_VISIBILITY_FILTER`に応じた処理を追加する。

```js
import { VisibilityFilters } from './actions'

const initialState = {
  visibilityFilter: VisibilityFilters.SHOW_ALL,
  todos: []
};

function todoApp(state = initialState, action) {
  switch (action.type) {
    case SET_VISIBILITY_FILTER:
      return Object.assign({}, state, {
        visibilityFilter: action.filter
      });
    default:
      return state;
  }
}
```

### Handling More Actions
複数のアクションを追加したバージョン。

```js
import {
  ADD_TODO,
  TOGGLE_TODO,
  SET_VISIBILITY_FILTER,
  VisibilityFilters
} from './actions';

const initialState = {
  visibilityFilter: VisibilityFilters.SHOW_ALL,
  todos: []
};
​
function todoApp(state = initialState, action) {
  switch (action.type) {
    case SET_VISIBILITY_FILTER:
      return Object.assign({}, state, {
        visibilityFilter: action.filter
      });
    case ADD_TODO:
      return Object.assign({}, state, {
        todos: [
          ...state.todos,
          {
            text: action.text,
            completed: false
          }
        ]
      });
    case TOGGLE_TODO:
      return Object.assign({}, state, {
        todos: state.todos.map((todo, index) => {
          if (index === action.index) {
            return Object.assign({}, todo, {
              completed: !todo.completed
            })
          }
          return todo
        })
      })
    default:
      return state
  }
}
```

突然変異に頼らずに配列内の特定のアイテムを更新したいので、インデックスにあるアイテムを除いて同じアイテムを持つ新しい配列を作成する必要があります。

そのような操作を書くことが多いと思われる場合は、immutability-helper、updeep、さらにはImmutableのようなヘルパーを使用して深刻な更新をネイティブにサポートすることをお勧めします。

最初にクローンを作成しない限り、状態の内部には決して割り当てないことを忘れないでください。


### Splitting Reducers
以下のコードは冗長

```js
function todoApp(state = initialState, action) {
  switch (action.type) {
    case SET_VISIBILITY_FILTER:
      return Object.assign({}, state, {
        visibilityFilter: action.filter
      })
    case ADD_TODO:
      return Object.assign({}, state, {
        todos: [
          ...state.todos,
          {
            text: action.text,
            completed: false
          }
        ]
      })
    case TOGGLE_TODO:
      return Object.assign({}, state, {
        todos: state.todos.map((todo, index) => {
          if (index === action.index) {
            return Object.assign({}, todo, {
              completed: !todo.completed
            })
          }
          return todo
        })
      })
    default:
      return state
  }
}
```

`todos`を別々の関数に簡単に分割できるので分割する。

```js
function todos(state = [], action) {
  switch (action.type) {
    case ADD_TODO:
      return [
        ...state,
        {
          text: action.text,
          completed: false
        }
      ];
    case TOGGLE_TODO:
      return state.map((todo, index) => {
        if (index === action.index) {
          return Object.assign({}, todo, {
            completed: !todo.completed
          });
        }

        return todo;
      });
    default:
      return state;
  }
}

function todoApp(state = initialState, action) {
  switch (action.type) {
    case SET_VISIBILITY_FILTER:
      return Object.assign({}, state, {
        visibilityFilter: action.filter
      });
    case ADD_TODO:
      return Object.assign({}, state, {
        todos: todos(state.todos, action)
      });
    case TOGGLE_TODO:
      return Object.assign({}, state, {
        todos: todos(state.todos, action)
      });
    default:
      return state
  }
}
```

今度は、メインのReducerを、状態の一部を管理するReducerを呼び出す関数として書き換えて、それらを単一のオブジェクトに結合することができる。

また、完全な初期状態を知る必要もない。最初にundefinedが与えられたとき、子Reducerが初期状態を返すだけで十分。

```js
function todos(state = [], action) {
  switch (action.type) {
    case ADD_TODO:
      return [
        ...state,
        {
          text: action.text,
          completed: false
        }
      ];
    case TOGGLE_TODO:
      return state.map((todo, index) => {
        if (index === action.index) {
          return Object.assign({}, todo, {
            completed: !todo.completed
          })
        }
        return todo;
      });
    default:
      return state
  }
}

function visibilityFilter(state = SHOW_ALL, action) {
  switch (action.type) {
    case SET_VISIBILITY_FILTER:
      return action.filter;
    default:
      return state;
  }
}

function todoApp(state = {}, action) {
  return {
    visibilityFilter: visibilityFilter(state.visibilityFilter, action),
    todos: todos(state.todos, action)
  }
}
```

上記は`combineReducers()`を利用して以下のように書き直せる。

```js
import { combineReducers } from 'redux'
​
const todoApp = combineReducers({
  visibilityFilter,
  todos
})
​
export default todoApp
```

↑は以下と同じだよ!

```js
export default function todoApp(state = {}, action) {
  return {
    visibilityFilter: visibilityFilter(state.visibilityFilter, action),
    todos: todos(state.todos, action)
  }
}
```




## Redux関連のChrome拡張
- Redux DevTool(https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd/related?hl=en)

## Reduxの処理の流れ
- [REDUX](http://slides.com/jenyaterpil/redux-from-twitter-hype-to-production#/9)