'use client'
import { useState } from 'react'

export interface WikilinkTriggerState {
  open: boolean
  query: string
  triggerPos: number
  activeIdx: number
}

export function useWikilinkTrigger() {
  const [state, setState] = useState<WikilinkTriggerState>({
    open: false,
    query: '',
    triggerPos: -1,
    activeIdx: 0,
  })

  function onChange(value: string, cursor: number) {
    const before = value.slice(0, cursor)
    const lastOpen = before.lastIndexOf('[[')
    const lastClose = before.lastIndexOf(']]')
    if (lastOpen !== -1 && lastOpen > lastClose) {
      setState({ open: true, query: before.slice(lastOpen + 2), triggerPos: lastOpen, activeIdx: 0 })
    } else {
      setState({ open: false, query: '', triggerPos: -1, activeIdx: 0 })
    }
  }

  function close() {
    setState({ open: false, query: '', triggerPos: -1, activeIdx: 0 })
  }

  function setActive(idx: number | ((prev: number) => number)) {
    setState(s => ({ ...s, activeIdx: typeof idx === 'function' ? idx(s.activeIdx) : idx }))
  }

  return { state, onChange, close, setActive }
}
