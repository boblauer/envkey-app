import React from 'react'
import h from "lib/ui/hyperscript_with_helpers"
import copy from 'copy-to-clipboard'

export default class KeyGenerated extends React.Component {

  constructor(props){
    super(props)
    this.state = { copied: false }
  }

  _kvPair(){
    return `ENVKEY=${[this.props.envkey, this.props.passphrase].join("-")}`
  }

  _kvTruncated(){
    return this._kvPair().slice(0, 20) + "…"
  }

  _onCopy(){
    const res = copy(this._kvPair(), {message: "Copy the text below with #{key}"})
    if (res){
      this.setState({copied: true})
    }
  }

  render(){
    return h.div(".key-generated", [
      h.span(".close", {onClick: this.props.onClose}, "⨉"),
      h.div(".top-row", [
        h.span(".primary", this._kvTruncated()),
        h.button(".copy", {onClick: ::this._onCopy}, "Copy"),
        (this.state.copied ? h.span(".copied", "Key copied.") : "")
      ]),
      h.div(".bottom-row", [
        h.p(`Key generated. Now set your ${{server: "server's", appUser: "app's local"}[this.props.joinType]} ENVKEY environment variable. Don't store or send it anywhere else.`),
        h.p("Envkey doesn't store the whole key, and therefore can't retrieve it, but you can always generate a new one."),
        h.a({href: "https://www.envkey.com/#integration", target: "__blank"}, "Integration quickstart ‣")
      ])
    ])
  }

}