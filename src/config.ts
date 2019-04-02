export interface IConfig {
  appId: string;
  bannerPrefix: string;
  broadcastPrefix: string;
  replyPrefix: string;
  port: number;
  host: string;
  tls: {
    use: boolean;
    certPath?: string;
    keyPath?: string;
  };
}
