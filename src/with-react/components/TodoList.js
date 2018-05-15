import React from 'react';
import PropTypes from 'prop-types';

const Todo = ({onClick, completed, text}) => (
  <li
   onClick={onClick}
   style={{
     textDecoration: completed ? 'line-trough' : 'none'
   }}
  >
    {text}
  </li>
);

Todo.propTypes = {
  onClick: PropTypes.func.isRequired,
  completed: PropTypes.boolean.isRequired,
  text: PropTypes.string.isRequired,
};

export default Todo