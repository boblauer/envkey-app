import { combineReducers } from 'redux'
import * as authReducers from './auth_reducers'
import * as orgReducers from './org_reducers'
import * as uiReducers from './ui_reducers'
import * as envReducers from './env_reducers'
import objectReducers from './object_reducers'
import { routerReducer } from 'react-router-redux'

export default combineReducers({
  ...authReducers,
  ...orgReducers,
  ...objectReducers,
  ...uiReducers,
  ...envReducers,
  routing: routerReducer
})