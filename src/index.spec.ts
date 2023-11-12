import { describe, expect, it } from 'vitest';

import { AbsoluteTimeUnit, AdjustmentType, DeltaTimeUnit, adjust, parse } from './index.js';

describe('timeAdjustment', () => {
  describe('parse', () => {
    describe('adjutsment type', () => {
      it('should support increases', () => {
        const parsed = parse('+1h');
        expect(parsed).toStrictEqual({
          type: AdjustmentType.Increment,
          values: {
            [DeltaTimeUnit.Hour]: 1,
          },
        });
      });

      it('should support decreases', () => {
        const parsed = parse('-2m');
        expect(parsed).toStrictEqual({
          type: AdjustmentType.Decrement,
          values: {
            [DeltaTimeUnit.Minute]: 2,
          },
        });
      });

      it('should support absolute set', () => {
        const parsed = parse('@20d');
        expect(parsed).toStrictEqual({
          type: AdjustmentType.Set,
          values: {
            [AbsoluteTimeUnit.Day]: 20,
          },
        });
      });

      it('should not support anything that is not increase, decrease or set', () => {
        const parsed = parse('%20d');
        expect(parsed).toBeNull();
      });
    });

    describe('time units', () => {
      it('should support seconds', () => {
        const parsed = parse('+10s');
        expect(parsed).toStrictEqual({
          type: AdjustmentType.Increment,
          values: {
            [DeltaTimeUnit.Second]: 10,
          },
        });
      });

      it('should support minutes', () => {
        const parsed = parse('-5m');
        expect(parsed).toStrictEqual({
          type: AdjustmentType.Decrement,
          values: {
            [DeltaTimeUnit.Minute]: 5,
          },
        });
      });

      it('should support hours', () => {
        const parsed = parse('@10h');
        expect(parsed).toStrictEqual({
          type: AdjustmentType.Set,
          values: {
            [AbsoluteTimeUnit.Hour]: 10,
          },
        });
      });

      it('should support days', () => {
        const parsed = parse('+1d');
        expect(parsed).toStrictEqual({
          type: AdjustmentType.Increment,
          values: {
            [DeltaTimeUnit.Day]: 1,
          },
        });
      });

      it('should support weeks', () => {
        const parsed = parse('+2w');
        expect(parsed).toStrictEqual({
          type: AdjustmentType.Increment,
          values: {
            [DeltaTimeUnit.Week]: 2,
          },
        });
      });

      it('should support months', () => {
        const parsed = parse('+3M');
        expect(parsed).toStrictEqual({
          type: AdjustmentType.Increment,
          values: {
            [DeltaTimeUnit.Month]: 3,
          },
        });
      });

      it('should support years', () => {
        const parsed = parse('+2y');
        expect(parsed).toStrictEqual({
          type: AdjustmentType.Increment,
          values: {
            [DeltaTimeUnit.Year]: 2,
          },
        });
      });

      it('should not support any other unit', () => {
        const parsed = parse('+2g');
        expect(parsed).toBeNull();
      });

      it('should support combination of valid units in ascending order', () => {
        const parsed = parse('-1h30d2y');
        expect(parsed).toStrictEqual({
          type: AdjustmentType.Decrement,
          values: {
            [DeltaTimeUnit.Hour]: 1,
            [DeltaTimeUnit.Day]: 30,
            [DeltaTimeUnit.Year]: 2,
          },
        });
      });

      it('should not support combination of valid units in an order that is not ascending', () => {
        const parsed = parse('-30d1h2y');
        expect(parsed).toBeNull();
      });
    });
  });

  describe('adjust', () => {
    it('should increase time with object', () => {
      const result = adjust(new Date('2021-01-01T00:00:00.000Z'), {
        type: AdjustmentType.Increment,
        values: {
          [DeltaTimeUnit.Day]: 1,
          [DeltaTimeUnit.Hour]: 1,
          [DeltaTimeUnit.Minute]: 1,
          [DeltaTimeUnit.Second]: 1,
        },
      });

      expect(result).toStrictEqual(new Date('2021-01-02T01:01:01.000Z'));
    });

    it('should decrease time with object', () => {
      const result = adjust(new Date('2021-01-01T00:00:00.000Z'), {
        type: AdjustmentType.Decrement,
        values: {
          [DeltaTimeUnit.Day]: 1,
          [DeltaTimeUnit.Hour]: 1,
          [DeltaTimeUnit.Minute]: 1,
          [DeltaTimeUnit.Second]: 1,
        },
      });

      expect(result).toStrictEqual(new Date('2020-12-30T22:58:59.000Z'));
    });

    it('should set time with object', () => {
      const result = adjust(new Date('2021-02-02T00:00:00.000Z'), {
        type: AdjustmentType.Set,
        values: {
          [AbsoluteTimeUnit.Day]: 12,
          [AbsoluteTimeUnit.Hour]: 4,
          [AbsoluteTimeUnit.Minute]: 1,
          [AbsoluteTimeUnit.Second]: 1,
        },
      });

      expect(result).toStrictEqual(new Date('2021-02-12T04:01:01.000Z'));
    });
  });
});
