import React from 'react'
import R from 'ramda'
import h from "lib/ui/hyperscript_with_helpers"
import {twitterShortTs} from 'lib/utils/date'
import copy from 'copy-to-clipboard'
import {imagePath} from "lib/ui"
import {capitalize} from "lib/utils/string"
import SmallLoader from 'components/shared/small_loader'
import KeyIcon from "components/shared/key_icon"

export default function ({
  onRenew,
  onRevoke,
  isRemoving,
  getUserFn,
  isGeneratingAssocKey,
  keyGeneratedAt,
  keyGeneratedById,
  envkey,
  passphrase,
  permissions,
  isCurrentUser=false,
  currentUser
}){
  const
    canGenerate = ()=> permissions.generateKey && !isRemoving,

    renderUpdateButtons = ()=> h.div(".update-buttons", [
        // h.button(".revoke", {
        //   onClick: onRevoke
        // }, "Revoke"),

        renderGenerateButton()
    ]),

    renderGenerateLabel = ()=> keyGeneratedAt ? "Renew" : "Generate",

    renderGenerateButton = ()=> h.button(".renew",{
      onClick: onRenew
    }, renderGenerateLabel()),

    renderButtons = ()=> {
      if (isRemoving)return ""
      if (isGeneratingAssocKey){
        return h(SmallLoader)
      } else if (canGenerate()) {
        if (keyGeneratedAt){
          return renderUpdateButtons()
        } else {
          return renderGenerateButton()
        }
      }
    },

    renderKeyLabel = ()=> {
      let contents

      if (isGeneratingAssocKey){
        contents = [
          h.span(".secondary", "Generating key...")
        ]
      } else if (keyGeneratedAt){
        const {firstName, lastName} = isCurrentUser ? currentUser : getUserFn(keyGeneratedById),
              fullName = [firstName, lastName].join(" ")
        contents = [
          h.span(".secondary", `${fullName} `),
          h.span(".key-date", "・ " + twitterShortTs(keyGeneratedAt))
        ]
      } else {
        contents = [
          h.span(".secondary", "No key generated")
        ]
      }

      return h.span(".key-label", contents)
    }

  return h.div(".keyable-actions", {
    className: [
      (keyGeneratedAt ? "has-key" : ""),
      (isGeneratingAssocKey ? "generating-key" : "")
    ].join(" ")

  },[
    h.div(".key-info", [
      h(KeyIcon),
      renderKeyLabel()
    ]),
    h.div(".actions", [
      renderButtons()
    ])
  ])

}