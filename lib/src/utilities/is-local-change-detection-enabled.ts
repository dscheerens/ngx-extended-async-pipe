import { LocalChangeDetectionControlFlag } from '../models/local-change-detection-control-flag.enum';

export function isLocalChangeDetectionEnabled(
    selfFlag: LocalChangeDetectionControlFlag | undefined,
    parentFlag: LocalChangeDetectionControlFlag | undefined,
): boolean {
    return selfFlag === LocalChangeDetectionControlFlag.Self ||
        selfFlag === LocalChangeDetectionControlFlag.SelfAndDescendants ||
        (
            parentFlag === LocalChangeDetectionControlFlag.SelfAndDescendants &&
            selfFlag !== LocalChangeDetectionControlFlag.CancelDescendants
        );
}
