export interface ICommand {
  readonly id: string;
  execute(): Promise<void>;
}
