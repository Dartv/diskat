import toNumber from 'lodash/toNumber';
import toInteger from 'lodash/toInteger';

import { ParameterType } from '../../types';

export const resolveType = (value: ParameterType): ParameterType | null => {
  if (Object.values(ParameterType).includes(value)) return value;

  return null;
};

export const isType = (value: string, expectedType: ParameterType): boolean => {
  switch (resolveType(expectedType)) {
    case ParameterType.BOOLEAN: {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === 'false';
    }
    case ParameterType.NUMBER:
    case ParameterType.INTEGER:
    case ParameterType.FLOAT:
      return !Number.isNaN(+value) && typeof +value === 'number';
    case ParameterType.STRING:
      return true;
    default:
      throw new Error(`Unrecognized type: ${expectedType}`);
  }
};

export const convertType = (value: string, type: ParameterType): boolean | number | string => {
  switch (resolveType(type)) {
    case ParameterType.BOOLEAN:
      return value.toLowerCase() === 'true';
    case ParameterType.NUMBER:
      return toNumber(value);
    case ParameterType.INTEGER:
      return toInteger(value);
    case ParameterType.FLOAT:
      return Number.parseFloat(value);
    case ParameterType.STRING:
    default:
      return value;
  }
};
