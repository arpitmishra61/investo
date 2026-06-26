
export const SUBSCRIBE = "SUBSCRIBE";
export const UNSUBSCRIBE = "UNSUBSCRIBE";
export const MM_STOP = "MM_STOP";
export const MM_START = "MM_START";

export type SubscribeMessage = {
    method: typeof SUBSCRIBE,
    params: string[]
}

export type UnsubscribeMessage = {
    method: typeof UNSUBSCRIBE,
    params: string[]
}

export type MmStopMessage = {
    method: typeof MM_STOP,
    params: string[]
}

export type MmStartMessage = {
    method: typeof MM_START,
    params: string[]
}

export type IncomingMessage = SubscribeMessage | UnsubscribeMessage | MmStopMessage | MmStartMessage;