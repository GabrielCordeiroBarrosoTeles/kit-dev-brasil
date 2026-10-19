import type { ExportFormat } from '../../presentation/profileExporters';
import { EXPORT_FORMAT_LABELS, EXPORT_FORMATS, exportProfile } from '../../presentation/profileExporters';
import type { Profile, ProfileKind } from '../../presentation/profiles';
import { PROFILE_LABELS } from '../../presentation/profiles';
import type { IClipboard, IEditor, IEditorProvider, INotifier, IQuickPick } from '../types';
import { EditorCommand } from './EditorCommand';
import { COMMAND_MESSAGES } from './messages';

export type GenerateProfile = (kind: ProfileKind) => Profile;

const FORMAT_ENTRIES = EXPORT_FORMATS.map((format) => ({ label: EXPORT_FORMAT_LABELS[format], value: format }));

export class GenerateProfileCommand extends EditorCommand {
  constructor(
    id: string,
    private readonly kind: ProfileKind,
    private readonly generate: GenerateProfile,
    private readonly picker: IQuickPick,
    private readonly clipboard: IClipboard,
    editors: IEditorProvider,
    notifier: INotifier,
  ) {
    super(id, editors, notifier);
  }

  protected async run(editor: IEditor): Promise<void> {
    const format = await this.pickFormat();
    if (format !== undefined) {
      await editor.replaceSelections(editor.selectedTexts().map(() => this.produce(format)));
    }
  }

  protected override async runWithoutEditor(): Promise<void> {
    const format = await this.pickFormat();
    if (format !== undefined) {
      await this.clipboard.writeText(this.produce(format));
      await this.notifier.info(COMMAND_MESSAGES.profileCopied(PROFILE_LABELS[this.kind]));
    }
  }

  private pickFormat(): Promise<ExportFormat | undefined> {
    return this.picker.pick(FORMAT_ENTRIES, COMMAND_MESSAGES.pickProfileFormat);
  }

  private produce(format: ExportFormat): string {
    return exportProfile(this.generate(this.kind), format);
  }
}
