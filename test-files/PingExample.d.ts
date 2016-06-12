export interface Message {
  ping?: Message.Ping;
  pong?: Message.Pong;
}
export namespace Message {
  export interface Ping {
    time: number;
  }

  export interface Pong {
    time: number;
  }
}
