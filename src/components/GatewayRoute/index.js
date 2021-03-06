import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { isAuthenticated } from '../../utils/Session';

const GatewayRoute = ({component: Component, ...rest}) => (
  <Route {...rest}
      render={(props) => {
        document.title = rest.title ? 'Modbus云网关 · ' + rest.title : 'Modbus云网关';
        return (
          !!isAuthenticated()
          ? <Component {...Object.assign({mqtt: rest.mqtt, gateway: rest.gateway}, props)} />
          : <Redirect to={{
            pathname: '/login',
            state: {from: props.location}
          }}/>
      )
      }}
  />
)

export default GatewayRoute