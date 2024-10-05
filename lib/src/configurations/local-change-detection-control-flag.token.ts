import { InjectionToken } from '@angular/core';
import { LocalChangeDetectionControlFlag } from '../models/local-change-detection-control-flag.enum';

export const LOCAL_CHANGE_DETECTION_EXTENDED_ASYNC_PIPE_CONTROL_FLAG =
    new InjectionToken<LocalChangeDetectionControlFlag>(
        'LOCAL_CHANGE_DETECTION_EXTENDED_ASYNC_PIPE_CONTROL_FLAG',
    );
