import { Provider } from '@angular/core';
import { LOCAL_CHANGE_DETECTION_EXTENDED_ASYNC_PIPE_CONTROL_FLAG } from '../configurations/local-change-detection-control-flag.token';
import { LocalChangeDetectionControlFlag } from '../models/local-change-detection-control-flag.enum';

export function enableExtendedAsyncPipeLocalChangeDetection(configuration?: { enableForChildren?: boolean }): Provider {
    return [
        {
            provide: LOCAL_CHANGE_DETECTION_EXTENDED_ASYNC_PIPE_CONTROL_FLAG,
            useValue: configuration?.enableForChildren
                ? LocalChangeDetectionControlFlag.SelfAndDescendants
                : LocalChangeDetectionControlFlag.Self,
        },
    ];
}

export function disableExtendedAsyncPipeLocalChangeDetection(): Provider {
    return [
        {
            provide: LOCAL_CHANGE_DETECTION_EXTENDED_ASYNC_PIPE_CONTROL_FLAG,
            useValue: LocalChangeDetectionControlFlag.CancelDescendants,
        },
    ];
}
