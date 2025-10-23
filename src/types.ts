export interface IframeItem {
  id: string;
  title: string;
  code: string;
  visible: boolean;
  group: string;
  dimensions?: {
    width: number;
    height: number;
  };
}
