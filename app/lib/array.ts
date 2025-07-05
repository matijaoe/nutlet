import { isNumber } from './typed'

export function sum(array: readonly [number, ...number[]]): number
export function sum(array: readonly number[]): number
export function sum<T>(array: readonly T[], fn: (item: T) => number): number
export function sum<T extends number | object>(
	array: readonly T[],
	fn?: (item: T) => number
) {
	fn ??= (item: T) => (isNumber(item) ? item : 0)
	return array?.reduce((acc, item) => acc + fn!(item), 0) ?? 0
}
