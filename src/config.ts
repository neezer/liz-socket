export interface IConfig {
  appId: string;
  bannerPrefix: string;
  broadcastPrefix: string;
  replyPrefix: string;
  port: number;
  tls: {
    use: boolean;
    certPath?: string;
    keyPath?: string;
  };
}
