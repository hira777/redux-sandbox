export default (state = 0, action) => {
  // Actionに応じたstateを返す
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state
  }
}