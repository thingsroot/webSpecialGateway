import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { isAuthenticated } from '../../utils/Session';

const PrivateRoute = ({component: Component, ...rest}) => (
  <Route {...rest}
      render={(props) => {
        document.title = rest.title ? '冬笋云 · ' + rest.title : '冬笋云 · 冬笋科技';
        return (
          !!isAuthenticated()
          ? <Component {...props} />
          : <Redirect to={{
            pathname: '/login',
            state: {from: props.location}
          }}/>
      )
      }}
  />
)

export default PrivateRoute