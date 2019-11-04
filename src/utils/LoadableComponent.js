import React from 'react';
import Loadable from 'react-loadable';
import LoadingPage from './LoadingPage';

const LoadableComponent = (component) => {
  return Loadable({
    loader: component,
    loading: ()=><LoadingPage/>
  })
}

export default LoadableComponent