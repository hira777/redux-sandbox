import { connect } from 'react-redux';
import { setVisibilityFilter } from '../actions';
import Link from '../components/Link';

// 現在のRedux StoreのstateをラッピングしているPresentational Componentsに
// 渡すpropsに変換する方法を示すmapStateToPropsを定義する
const mapStateToProps = (state, ownProps) => {
  return {
    active: ownProps.filter === state.visibilityFilter,
  };
};

// `dispatch()`メソッドを受け取り、Presentational Componentsに注入するコールバックのpropsを返す
// mapDispatchToPropsを定義する
const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onClick: () => {
      dispatch(setVisibilityFilter(ownProps.filter));
    },
  };
};

const FilterLink = connect(mapStateToProps, mapDispatchToProps)(Link);

export default FilterLink;
