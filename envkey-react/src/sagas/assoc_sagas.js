import { takeEvery, put, call, take, select } from 'redux-saga/effects'
import pluralize from 'pluralize'
import {decamelize} from 'xcase'
import {apiSaga} from './helpers'
import {
  ADD_ASSOC_REQUEST,
  ADD_ASSOC_SUCCESS,
  ADD_ASSOC_FAILED,
  REMOVE_ASSOC_REQUEST,
  REMOVE_ASSOC_SUCCESS,
  REMOVE_ASSOC_FAILED,
  CREATE_ASSOC_REQUEST,
  CREATE_ASSOC_SUCCESS,
  CREATE_ASSOC_FAILED,
  CREATE_OBJECT_REQUEST,
  CREATE_OBJECT_SUCCESS,
  CREATE_OBJECT_FAILED,
  GENERATE_ASSOC_KEY,
  GENERATE_ASSOC_KEY_REQUEST,
  GENERATE_ASSOC_KEY_SUCCESS,
  GENERATE_ASSOC_KEY_FAILED,
  addAssoc,
  generateKeyRequest
} from "actions"
import {attachAssocEnvs} from './helpers/attach_envs'
import {
  generateKeys,
  secureRandomAlphanumeric,
  encryptJson
} from 'lib/crypto'
import {
  getCurrentOrg,
  getServer,
  getAppUser,
  getRawEnvWithPendingForApp
} from 'selectors'
import { assocTable } from 'lib/assoc/helpers'

const
  addRemoveAssocApiSaga = ({method, actionTypes})=> {
    return apiSaga({
      authenticated: true,
      method: method,
      actionTypes: actionTypes,
      urlFn: ({meta})=> {
        const {parentType, parentId, targetId} = meta,
              parentTable = decamelize(pluralize(parentType))
        return `/${parentTable}/${parentId}/${assocTable(meta)}${targetId ? ('/' + targetId): ''}.json`
      }
    })
  },

  generateKeyApiSaga = apiSaga({
    authenticated: true,
    method: "patch",
    actionTypes: [GENERATE_ASSOC_KEY_SUCCESS, GENERATE_ASSOC_KEY_FAILED],
    urlFn: ({meta})=> {
      const {parentType, parentId, targetId} = meta,
            parentTable = decamelize(pluralize(parentType))
      return `/${parentTable}/${parentId}/${assocTable(meta)}/${targetId}/generate_key.json`
    }
  })

function* onAddAssoc(action){
  const actionWithEnvs = yield call(attachAssocEnvs, action),
        apiSaga = addRemoveAssocApiSaga({
          method: "post",
          actionTypes: [ADD_ASSOC_SUCCESS, ADD_ASSOC_FAILED]
        })

  yield call(apiSaga, actionWithEnvs)
}

function* onRemoveAssoc(action){
  const actionWithEnvs = yield call(attachAssocEnvs, action),
        apiSaga = addRemoveAssocApiSaga({
          method: "delete",
          actionTypes: [REMOVE_ASSOC_SUCCESS, REMOVE_ASSOC_FAILED]
        })

  yield call(apiSaga, actionWithEnvs)
}

function* onCreateAssoc({meta, payload}){
  let failAction

  yield put({
    type: CREATE_OBJECT_REQUEST,
    meta: {objectType: meta.assocType, createAssoc: true},
    payload
  })

  const createResultAction = yield take([CREATE_OBJECT_SUCCESS, CREATE_OBJECT_FAILED])

  if (createResultAction.type == CREATE_OBJECT_SUCCESS){
    yield put(addAssoc({...meta, assocId: createResultAction.payload.id}))

    const addResultAction = yield take([ADD_ASSOC_SUCCESS, ADD_ASSOC_FAILED])

    if (addResultAction.type == ADD_ASSOC_SUCCESS){
      yield put({type: CREATE_ASSOC_SUCCESS, meta})
    } else {
      failAction = addResultAction
    }

  } else {
    failAction = createResultAction
  }

  if(failAction)yield put({...failAction, meta, type: CREATE_ASSOC_FAILED})
}

function* onGenerateKey(action){
  const
    currentOrg = yield select(getCurrentOrg),

    {meta: {parent: app, assocType, targetId}} = action,

    selector = {server: getServer, appUser: getAppUser}[assocType],

    target = yield select(selector(targetId)),

    assocId = {server: targetId, appUser: target.userId}[assocType],

    environment = {server: target.role, appUser: "development"}[assocType],

    passphrase = secureRandomAlphanumeric(14),

    {
      privateKeyArmored: encryptedPrivkey,
      publicKeyArmored: pubkey
    } = yield call(generateKeys, {
      id: [currentOrg.slug, app.slug, target.slug].join("-"),
      passphrase
    }),

    rawEnv = yield select(getRawEnvWithPendingForApp({appId: app.id, environment})),

    encryptedRawEnv = yield call(encryptJson, {
      pubkey,
      data: rawEnv
    })

  yield put(generateKeyRequest({
    ...action.meta,
    assocId,
    encryptedPrivkey,
    pubkey,
    encryptedRawEnv,
    passphrase
  }))
}

export default function* assocSagas(){
  yield [
    takeEvery(ADD_ASSOC_REQUEST, onAddAssoc),
    takeEvery(REMOVE_ASSOC_REQUEST, onRemoveAssoc),
    takeEvery(CREATE_ASSOC_REQUEST, onCreateAssoc),
    takeEvery(GENERATE_ASSOC_KEY, onGenerateKey),
    takeEvery(GENERATE_ASSOC_KEY_REQUEST, generateKeyApiSaga)
  ]
}
