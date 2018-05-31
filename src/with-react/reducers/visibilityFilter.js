import { VisibilityFilters } from '../actions';

const visibilityFilter = (state = VisibilityFilters.SHOW_ALL, action) => {
  switch (action.type) {
    case 'SET_VISIBILITY_FILTER':
      // MEMO:普通にstate以外を返している
      return action.filter;
    default:
      return state;
  }
};

export default visibilityFilter;
