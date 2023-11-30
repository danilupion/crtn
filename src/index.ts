import { add, set, sub } from 'date-fns';

enum InputDeltaTimeUnit {
  Year = 'y',
  Month = 'M',
  Week = 'w',
  Day = 'd',
  Hour = 'h',
  Minute = 'm',
  Second = 's',
}

enum InputAbsoluteTimeUnit {
  Year = 'y',
  Month = 'M',
  Date = 'd',
  Hour = 'h',
  Minute = 'm',
  Second = 's',
}

export enum DeltaTimeUnit {
  Second = 'seconds',
  Minute = 'minutes',
  Hour = 'hours',
  Day = 'days',
  Week = 'weeks',
  Month = 'months',
  Year = 'years',
}

export enum AbsoluteTimeUnit {
  Second = 'seconds',
  Minute = 'minutes',
  Hour = 'hours',
  Day = 'date',
  Month = 'month',
  Year = 'year',
}

const inputTimeUnitToDeltaTimeUnitMap: Record<InputDeltaTimeUnit, DeltaTimeUnit> = {
  [InputDeltaTimeUnit.Second]: DeltaTimeUnit.Second,
  [InputDeltaTimeUnit.Minute]: DeltaTimeUnit.Minute,
  [InputDeltaTimeUnit.Hour]: DeltaTimeUnit.Hour,
  [InputDeltaTimeUnit.Day]: DeltaTimeUnit.Day,
  [InputDeltaTimeUnit.Week]: DeltaTimeUnit.Week,
  [InputDeltaTimeUnit.Month]: DeltaTimeUnit.Month,
  [InputDeltaTimeUnit.Year]: DeltaTimeUnit.Year,
};

const inputTimeUnitToAbsoluteTimeUnitMap: Record<InputAbsoluteTimeUnit, AbsoluteTimeUnit> = {
  [InputAbsoluteTimeUnit.Second]: AbsoluteTimeUnit.Second,
  [InputAbsoluteTimeUnit.Minute]: AbsoluteTimeUnit.Minute,
  [InputAbsoluteTimeUnit.Hour]: AbsoluteTimeUnit.Hour,
  [InputAbsoluteTimeUnit.Date]: AbsoluteTimeUnit.Day,
  [InputAbsoluteTimeUnit.Month]: AbsoluteTimeUnit.Month,
  [InputAbsoluteTimeUnit.Year]: AbsoluteTimeUnit.Year,
};

export enum AdjustmentType {
  Increment = '+',
  Decrement = '-',
  Set = '@',
}

export type IncrementAdjustment = {
  type: AdjustmentType.Increment;
  values: {
    [unit in DeltaTimeUnit]?: number;
  };
};

export type DecrementAdjustment = {
  type: AdjustmentType.Decrement;
  values: {
    [unit in DeltaTimeUnit]?: number;
  };
};

export type SetAdjustment = {
  type: AdjustmentType.Set;
  values: {
    [unit in AbsoluteTimeUnit]?: number;
  };
};

export type TimeAdjustment = IncrementAdjustment | DecrementAdjustment | SetAdjustment;

const buildRegexSourceFromTimeUnits = (symbols: string[], timeUnits: object): string => {
  // Start with the regex for the adjustment type
  const adjustmentTypes = symbols.join('');
  const typePattern = `[${adjustmentTypes}]`;

  // For each time unit, create a pattern with a negative lookahead to ensure it does not repeat
  const unitPatterns = Object.values(timeUnits)
    .map((unit) => {
      return `(\\d+${unit})?`;
    })
    .join('');

  // The full regex pattern matches an adjustment type followed by any combination of unit patterns
  return `${typePattern}${unitPatterns}`;
};

const incrementTimeAdjustmentRegexSource = buildRegexSourceFromTimeUnits(
  [AdjustmentType.Increment],
  InputDeltaTimeUnit,
);

const decrementTimeAdjustmentRegexSource = buildRegexSourceFromTimeUnits(
  [AdjustmentType.Decrement],
  InputDeltaTimeUnit,
);

const setTimeAdjustmentRegexSource = buildRegexSourceFromTimeUnits(
  [AdjustmentType.Set],
  InputAbsoluteTimeUnit,
);

// Common parsing logic abstracted into a single function
const parseTimeAdjustment = <InputTimeUnit extends string, OutputTimeUnit extends string>(
  expression: string,
  adjustmentRegex: RegExp,
  units: Record<string, InputTimeUnit>,
  inputTimeUnitMap: Record<InputTimeUnit, OutputTimeUnit>,
  adjustmentType: AdjustmentType,
): TimeAdjustment | null => {
  const match = expression.match(adjustmentRegex);

  if (match) {
    const values: { [unit: string]: number } = {};

    // Extract the values for each time unit
    Object.values(units).forEach((unit) => {
      const unitRegex = new RegExp(`(\\d+)${unit}`);
      const unitMatch = expression.match(unitRegex);
      if (unitMatch) {
        values[inputTimeUnitMap[unit]] = parseInt(unitMatch[1], 10);
      }
    });

    return {
      type: adjustmentType,
      values,
    };
  }

  return null;
};

const parseAdd = (expression: string): IncrementAdjustment | null => {
  return parseTimeAdjustment(
    expression,
    new RegExp(`^${incrementTimeAdjustmentRegexSource}$`),
    InputDeltaTimeUnit,
    inputTimeUnitToDeltaTimeUnitMap,
    AdjustmentType.Increment,
  ) as IncrementAdjustment | null;
};

const parseSub = (expression: string): DecrementAdjustment | null => {
  return parseTimeAdjustment(
    expression,
    new RegExp(`^${decrementTimeAdjustmentRegexSource}$`),
    InputDeltaTimeUnit,
    inputTimeUnitToDeltaTimeUnitMap,
    AdjustmentType.Decrement,
  ) as DecrementAdjustment | null;
};

const parseSet = (expression: string): SetAdjustment | null => {
  return parseTimeAdjustment(
    expression,
    new RegExp(`^${setTimeAdjustmentRegexSource}$`),
    InputAbsoluteTimeUnit,
    inputTimeUnitToAbsoluteTimeUnitMap,
    AdjustmentType.Set,
  ) as SetAdjustment | null;
};

export const parse = (expression: string): TimeAdjustment[] | null => {
  const parts = expression.split(' ');

  const result = parts.map((part) => {
    return parseAdd(part) || parseSub(part) || parseSet(part) || null;
  });

  return result.some((r) => r === null) ? null : (result as TimeAdjustment[]);
};

export const adjust = (
  date: Date,
  adjustments: TimeAdjustment | TimeAdjustment[] | string,
): Date => {
  const adjustmentObject = typeof adjustments === 'string' ? parse(adjustments) : adjustments;

  if (!adjustmentObject) {
    return date;
  }

  if (Array.isArray(adjustmentObject)) {
    return adjustmentObject.reduce((date, adjustment) => adjust(date, adjustment), date);
  }

  const { type, values } = adjustmentObject;

  switch (type) {
    case AdjustmentType.Set:
      return set(date, values);
    case AdjustmentType.Increment:
      return add(date, values);
    case AdjustmentType.Decrement:
      return sub(date, values);
  }

  return date;
};
