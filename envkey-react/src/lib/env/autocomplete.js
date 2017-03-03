import R from 'ramda'
import {inheritedShallow} from "./inheritance"

const getEnvsFilter = ({entryKey, envsWithMeta, environment}, searchStr) => envOpt => {
  // Remove current environment
  if (envOpt === environment)return false

  // Remove circular dependencies
  let inherited = inheritedShallow({entryKey, envsWithMeta, inherits: envOpt})
  while (inherited.inherits){
    if(inherited.inherits === environment)return false
    inherited = inheritedShallow({entryKey, envsWithMeta, inherits: inherited.inherits})
  }

  return true
}

export const optIndex = (searchStr, opts) => R.findIndex(({val})=> val === searchStr)(opts)

export const getAutocompleteOpts = ({entryKey,
                                  inherits,
                                  val,
                                  envsWithMeta,
                                  environments,
                                  environment}, searchStr)=>{
  const baseOpts = searchStr ? [] : [{val: null, label: "(undefined)", className: "undefined"},
                                     {val: "", label: "(empty string)", className: "empty-string"}],

        envOpts = environments.filter(getEnvsFilter({entryKey, envsWithMeta, environment}, searchStr))
                              .map(envOpt => ({val: envOpt,
                                               label: envOpt,
                                               selectedInherits: true,
                                               className: "inherits",
                                               prefix: "inherits"})),

        opts = baseOpts.concat(envOpts),

        hasMatch = optIndex(searchStr, opts) > -1

  return hasMatch ? opts : opts.filter(({val})=> val.indexOf(searchStr) == 0)
}