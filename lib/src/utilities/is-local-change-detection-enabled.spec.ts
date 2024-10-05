/* eslint-disable max-len */
import { LocalChangeDetectionControlFlag } from '../models/local-change-detection-control-flag.enum';
import { isLocalChangeDetectionEnabled } from './is-local-change-detection-enabled';

describe('isLocalChangeDetectionEnabled', () => {
    it('correctly checks without any flags', () => {
        expect(isLocalChangeDetectionEnabled(undefined, undefined)).toBe(false);
    });

    it('correctly checks with self flag: self, and parent flag: self', () => {
        expect(isLocalChangeDetectionEnabled(LocalChangeDetectionControlFlag.Self, LocalChangeDetectionControlFlag.Self)).toBe(true);
    });

    it('correctly checks with self flag: self, and parent flag: self and descendants', () => {
        expect(isLocalChangeDetectionEnabled(LocalChangeDetectionControlFlag.Self, LocalChangeDetectionControlFlag.SelfAndDescendants)).toBe(true);
    });

    it('correctly checks with self flag: self, and parent flag: cancel descendants', () => {
        expect(isLocalChangeDetectionEnabled(LocalChangeDetectionControlFlag.Self, LocalChangeDetectionControlFlag.CancelDescendants)).toBe(true);
    });

    it('correctly checks with self flag: self, without parent flag', () => {
        expect(isLocalChangeDetectionEnabled(LocalChangeDetectionControlFlag.Self, undefined)).toBe(true);
    });

    it('correctly checks with self flag: self and descendants, and parent flag: self', () => {
        expect(isLocalChangeDetectionEnabled(LocalChangeDetectionControlFlag.SelfAndDescendants, LocalChangeDetectionControlFlag.Self)).toBe(true);
    });

    it('correctly checks with self flag: self and descendants, and parent flag: self and descendants', () => {
        expect(isLocalChangeDetectionEnabled(LocalChangeDetectionControlFlag.SelfAndDescendants, LocalChangeDetectionControlFlag.SelfAndDescendants)).toBe(true);
    });

    it('correctly checks with self flag: self and descendants, and parent flag: cancel descendants', () => {
        expect(isLocalChangeDetectionEnabled(LocalChangeDetectionControlFlag.SelfAndDescendants, LocalChangeDetectionControlFlag.CancelDescendants)).toBe(true);
    });

    it('correctly checks with self flag: self and descendants, without parent flag', () => {
        expect(isLocalChangeDetectionEnabled(LocalChangeDetectionControlFlag.SelfAndDescendants, undefined)).toBe(true);
    });

    it('correctly checks with self flag: cancel descendants, and parent flag: self', () => {
        expect(isLocalChangeDetectionEnabled(LocalChangeDetectionControlFlag.CancelDescendants, LocalChangeDetectionControlFlag.Self)).toBe(false);
    });

    it('correctly checks with self flag: cancel descendants, and parent flag: self and descendants', () => {
        expect(isLocalChangeDetectionEnabled(LocalChangeDetectionControlFlag.CancelDescendants, LocalChangeDetectionControlFlag.SelfAndDescendants)).toBe(false);
    });

    it('correctly checks with self flag: cancel descendants, and parent flag: cancel descendants', () => {
        expect(isLocalChangeDetectionEnabled(LocalChangeDetectionControlFlag.CancelDescendants, LocalChangeDetectionControlFlag.CancelDescendants)).toBe(false);
    });

    it('correctly checks with self flag: cancel descendants, without parent flag', () => {
        expect(isLocalChangeDetectionEnabled(LocalChangeDetectionControlFlag.CancelDescendants, undefined)).toBe(false);
    });

    it('correctly checks without self flag, and parent flag: self', () => {
        expect(isLocalChangeDetectionEnabled(undefined, LocalChangeDetectionControlFlag.Self)).toBe(false);
    });

    it('correctly checks without self flag, and parent flag: self and descendants', () => {
        expect(isLocalChangeDetectionEnabled(undefined, LocalChangeDetectionControlFlag.SelfAndDescendants)).toBe(true);
    });

    it('correctly checks without self flag, and parent flag: cancel descendants', () => {
        expect(isLocalChangeDetectionEnabled(undefined, LocalChangeDetectionControlFlag.CancelDescendants)).toBe(false);
    });
});
