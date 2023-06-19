export type LogHandler = (...args: any) => void

export const Logger = (onLog: LogHandler, onError: LogHandler) => {
  return {
    log (...args: any) {
      onLog('[SWRTC]', ...args)
    },

    error (...args: any) {
      onError('[SWRTC]', ...args)
    },
  }
}
