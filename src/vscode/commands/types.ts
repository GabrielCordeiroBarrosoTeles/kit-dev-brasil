export interface ICommand {
  readonly id: string;
  execute(argument?: unknown): Promise<void>;
}
